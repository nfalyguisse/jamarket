import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsOptional()
  lastName?: string;
}
