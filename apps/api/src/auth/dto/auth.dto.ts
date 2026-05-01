import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class GenerateNonceDto {
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  @IsEthereumAddress()
  wallet!: string;
}

export class WalletLoginDto {
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  @IsEthereumAddress()
  wallet!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signature!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @ApiProperty({ description: 'Unix epoch milliseconds from the nonce message issuedAt' })
  @IsInt()
  @Min(1)
  timestamp!: number;

  @ApiProperty({ required: false, description: 'Backward-compatible full nonce message from the client' })
  @IsString()
  message?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
