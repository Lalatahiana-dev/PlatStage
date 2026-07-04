import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type UserWithRoles = {
  id_user: number;
  email: string;
  password: string;
  roles: Array<{
    role: {
      name: string;
    };
  }>;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService, // ✅ manampy
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto & { role?: string }) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) throw new UnauthorizedException('Email already used');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      password: hashedPassword,
    });

    // ✅ Assign role — STUDENT na COMPANY ihany, tsy ADMIN
    const roleName = data.role === 'COMPANY' ? 'COMPANY' : 'STUDENT';
    await this.rolesService.assignDefaultRole(user.id_user, roleName);

    // ✅ Averina user miaraka amin'ny roles vaovao
    const userWithRoles = await this.usersService.findByEmail(data.email);
    return this.signToken(userWithRoles as UserWithRoles);
  }

  async login(data: LoginDto) {
    const user: UserWithRoles | null = await this.usersService.findByEmail(
      data.email,
    );

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  private signToken(user: UserWithRoles) {
    const roleNames = user.roles.map((r) => r.role.name);

    return {
      access_token: this.jwtService.sign({
        sub: user.id_user,
        email: user.email,
        roles: roleNames,
      }),
    };
  }
}
