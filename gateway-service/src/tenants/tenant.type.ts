import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class TenantType {
  @Field(() => ID)
  id: string;

  @Field()
  companyName: string;

  @Field({ nullable: true })
  jiraDomain: string;

  @Field({ nullable: true })
  jiraAuthToken: string;

  @Field()
  createdAt: Date;
}
