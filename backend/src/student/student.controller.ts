import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahita students rehetra (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.studentService.findAll();
  }

  @Get('user/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahita student profile arakaraka ny id_user' })
  @UseGuards(AuthGuard('jwt'))
  async findByUser(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findByUser(id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahita student iray' })
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(id);
  }
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamorona student profile (STUDENT/ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async create(@Body() body: CreateStudentDto) {
    return this.studentService.create(body);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manova student profile (STUDENT/ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStudentDto,
  ) {
    return this.studentService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamafa student profile (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.remove(id);
  }

  @Post(':id/skills')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manampy skill amin'ny student (STUDENT/ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async addSkill(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { id_skill: number },
  ) {
    return this.studentService.addSkill(id, body.id_skill);
  }

  @Delete(':id/skills/:id_skill')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mamafa skill avy amin'ny student (STUDENT/ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async removeSkill(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_skill', ParseIntPipe) id_skill: number,
  ) {
    return this.studentService.removeSkill(id, id_skill);
  }
}
