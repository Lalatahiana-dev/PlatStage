import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // =========================
  // REGISTER
  // =========================
  async register(data: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new UnauthorizedException('Email already used');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      password: hashedPassword,
    });

    return this.signToken(user.id_user, user.email);
  }

  // =========================
  // LOGIN
  // =========================
  async login(data: LoginDto) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id_user, user.email);
  }

  // =========================
  // JWT SIGN
  // =========================
  private signToken(userId: number, email: string) {
    return {
      access_token: this.jwtService.sign({
        sub: userId,
        email: email,
      }),
    };
  }
}
