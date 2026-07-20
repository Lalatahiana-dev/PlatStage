import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class GeneralDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  platformName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  platformDescription?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  websiteUrl?: string;
}

class ProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  prenom?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;
}

class AppearanceDto {
  @ApiPropertyOptional({ enum: ['light', 'dark'] })
  @IsString()
  @IsOptional()
  theme?: 'light' | 'dark';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({ enum: ['compact', 'default'] })
  @IsString()
  @IsOptional()
  sidebarStyle?: 'compact' | 'default';

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  denseTables?: boolean;
}

class NotificationsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  newUserNotifications?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  newApplicationNotifications?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  newInterviewNotifications?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  systemAlerts?: boolean;
}

class SecurityDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(5)
  @IsOptional()
  sessionTimeout?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean;
}

class PlatformConfigDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUploadSize?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  allowedFormats?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultAvatar?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultApplicationStatus?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(15)
  @IsOptional()
  defaultInterviewDuration?: number;
}

class UxDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  animationsReduced?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  compactMode?: boolean;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralDto)
  general?: GeneralDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AppearanceDto)
  appearance?: AppearanceDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationsDto)
  notifications?: NotificationsDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SecurityDto)
  security?: SecurityDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PlatformConfigDto)
  platformConfig?: PlatformConfigDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => UxDto)
  ux?: UxDto;
}
