import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class UpdateSubscriberEmailDto {
  @ApiProperty({ example: 'new.email@example.com', description: 'New email ID of the subscriber' })
  @IsEmail()
  @IsNotEmpty()
  emailid: string
}

export class UpdateSubscriberBillingDetailsDto {
  @ApiProperty({ example: 'ABCDE1234F', description: 'PAN number of the subscriber' })
  @IsString()
  @IsNotEmpty()
  pan: string

  @ApiProperty({ example: 'John Doe', description: 'Name as per PAN card' })
  @IsString()
  @IsNotEmpty()
  name_as_per_pan: string

  @ApiProperty({ example: '1990-01-01', description: 'Date of birth' })
  @IsString()
  @IsNotEmpty()
  dob: string

  @ApiProperty({ example: 'Karnataka', description: 'State of the subscriber' })
  @IsString()
  @IsNotEmpty()
  state: string
}
