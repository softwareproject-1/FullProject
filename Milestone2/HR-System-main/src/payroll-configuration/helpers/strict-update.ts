// // src/payroll-configuration/helpers/strict-update.ts
// import { BadRequestException } from '@nestjs/common';
// import { Document, Model, Schema } from 'mongoose';

// type SchemaProvider =
//   | Schema
//   | Pick<Model<unknown>, 'schema'>
//   | Pick<Document, 'schema'>;

// function resolveSchema(provider: SchemaProvider): Schema {
//   if (provider instanceof Schema) {
//     return provider;
//   }

//   return provider.schema;
// }

// export function strictUpdate<T extends object>(
//   dto: Partial<T>,
//   provider: SchemaProvider,
// ) {
//   const schema = resolveSchema(provider);
//   const allowedKeys = Object.keys(schema.paths); // keys from schema

//   for (const key of Object.keys(dto)) {
//     if (!allowedKeys.includes(key)) {
//       throw new BadRequestException(
//         `Field "${key}" is not allowed in this schema`,
//       );
//     }
//   }

//   return dto; // safe dto, all keys valid
// }
// src/payroll-configuration/helpers/strict-update.ts
import { BadRequestException } from '@nestjs/common';
import { Document, Model, Schema } from 'mongoose';

type SchemaProvider =
  | Schema
  | Pick<Model<unknown>, 'schema'>
  | Pick<Document, 'schema'>;

function resolveSchema(provider: SchemaProvider): Schema {
  if (provider instanceof Schema) {
    return provider;
  }
  return provider.schema;
}

export function strictUpdate<T extends object>(
  dto: Partial<T>,
  provider: SchemaProvider,
): Partial<T> {
  const schema = resolveSchema(provider);
  const allowedKeys = Object.keys(schema.paths);

  for (const key of Object.keys(dto)) {
    if (!allowedKeys.includes(key)) {
      throw new BadRequestException(
        `Field "${key}" is not allowed in this schema`,
      );
    }

    // Check for nested objects with their own schema (subdocuments)
    const path = schema.path(key) as any;
    if (
      path?.schema && // has nested schema
      typeof dto[key] === 'object' &&
      dto[key] !== null
    ) {
      // Recursive call for nested object
      dto[key] = strictUpdate(dto[key], path.schema);
    }
  }

  return dto; // all keys valid, including nested
}
