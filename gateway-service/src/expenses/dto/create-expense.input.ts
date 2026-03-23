import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateExpenseInput {
  @Field()
  tenantId: string;

  @Field()
  provider: string;

  @Field()
  serviceName: string;

  @Field(() => Float)
  cost: number;
}
