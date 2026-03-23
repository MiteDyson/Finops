import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantsModule } from './tenants/tenants.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    // 1. Load .env variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. GraphQL with Apollo - code-first approach, auto-generates schema.gql
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true, // Enable GraphQL Playground in dev
    }),

    // 3. TypeORM connected to Supabase
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Keep synchronize: true for dev only — set to false in production!
        synchronize: true,
        ssl: {
          rejectUnauthorized: false, // Required for Supabase
        },
      }),
    }),

    // Feature modules
    TenantsModule,
    ExpensesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
