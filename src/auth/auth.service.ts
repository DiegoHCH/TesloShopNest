import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { CreateUserDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService')


  constructor(
    @InjectRepository(User)
    private readonly userRepository : Repository<User>,

    private readonly jwtService: JwtService,
  ){}

  async create(createUserDto: CreateUserDto) {
    

    try {

      const {password, ...userData} = createUserDto;

      const user = this.userRepository.create( {
        ...userData,
        password: bcrypt.hashSync( password, 10 )
      } );
      await this.userRepository.save( user );
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({uuid: user.id}),
      };
    } catch (error) {
      this.handlerDBExceptions(error);
    }

  }

  async login(loginUserDto: LoginUserDto) {

    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: {email},
      select: {email: true, password: true, id: true}
    });

    if(!user)
      throw new UnauthorizedException('Credentials are not valid (email)');

    if(!bcrypt.compareSync(password, user.password))
     throw new UnauthorizedException('Credentials are not valid (password)');

    return {
      ...user,
      token: this.getJwtToken({uuid: user.id}),
    };
  }

  async checkAuthStatus( user: User){
    return {
      ...user,
      token: this.getJwtToken({uuid: user.id}),
    };
  }

  private getJwtToken ( payload: JwtPayload ) {

    const token = this.jwtService.sign( payload );
    return token;

  }


  private handlerDBExceptions( error: any ): never{
    if( error.code == '23505' )
      throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
