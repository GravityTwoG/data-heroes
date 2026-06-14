type OpenAPIDocument = {
  components?: {
    schemas?: Record<string, OpenAPISchema>;
  };
  paths?: Record<string, Record<string, OpenAPIOperation | unknown>>;
};

type OpenAPIOperation = {
  operationId?: string;
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
};

type OpenAPIRequestBody = {
  content?: Record<string, OpenAPIMediaType>;
};

type OpenAPIResponse = {
  content?: Record<string, OpenAPIMediaType>;
};

type OpenAPIMediaType = {
  schema?: OpenAPISchema;
};

type OpenAPISchema = Record<string, unknown>;

enum OpenAPIContentType {
  JSON = "application/json",
}

enum OpenAPIStatusCode {
  OK = "200",
  CREATED = "201",
  NO_CONTENT = "204",
  BAD_REQUEST = "400",
  UNAUTHORIZED = "401",
  FORBIDDEN = "403",
  NOT_FOUND = "404",
  CONFLICT = "409",
  TOO_MANY_REQUESTS = "429",
  UNPROCESSABLE_ENTITY = "422",
}

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);

const SUCCESS_STATUS_CODES = new Set<string>([
  OpenAPIStatusCode.OK,
  OpenAPIStatusCode.CREATED,
  OpenAPIStatusCode.NO_CONTENT,
]);

const RESPONSE_SUFFIX_BY_STATUS: Record<string, string> = {
  [OpenAPIStatusCode.BAD_REQUEST]: "BadRequestResponse",
  [OpenAPIStatusCode.UNAUTHORIZED]: "UnauthorizedResponse",
  [OpenAPIStatusCode.FORBIDDEN]: "ForbiddenResponse",
  [OpenAPIStatusCode.NOT_FOUND]: "NotFoundResponse",
  [OpenAPIStatusCode.CONFLICT]: "ConflictResponse",
  [OpenAPIStatusCode.TOO_MANY_REQUESTS]: "TooManyRequestsResponse",
  [OpenAPIStatusCode.UNPROCESSABLE_ENTITY]: "UnprocessableEntityResponse",
};

export function withNamedOperationSchemas<TDocument>(
  document: TDocument,
): TDocument {
  const openAPIDocument = document as OpenAPIDocument;
  const schemas = openAPIDocument.components?.schemas ?? {};
  openAPIDocument.components = {
    ...openAPIDocument.components,
    schemas,
  };

  Object.entries(openAPIDocument.paths ?? {}).forEach(([, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (
        !HTTP_METHODS.has(method) ||
        !isOperation(operation) ||
        !operation.operationId
      ) {
        return;
      }

      moveRequestBodySchema(schemas, operation);
      moveResponseSchemas(schemas, operation);
    });
  });

  return document;
}

function isOperation(value: unknown): value is OpenAPIOperation {
  return typeof value === "object" && value !== null && "responses" in value;
}

function moveRequestBodySchema(
  schemas: Record<string, OpenAPISchema>,
  operation: OpenAPIOperation,
) {
  const mediaType = operation.requestBody?.content?.[OpenAPIContentType.JSON];

  if (!mediaType?.schema || isReference(mediaType.schema)) {
    return;
  }

  const componentName = `${toPascalCase(operation.operationId!)}Body`;
  schemas[componentName] = mediaType.schema;
  mediaType.schema = toReference(componentName);
}

function moveResponseSchemas(
  schemas: Record<string, OpenAPISchema>,
  operation: OpenAPIOperation,
) {
  Object.entries(operation.responses ?? {}).forEach(
    ([statusCode, response]) => {
      const mediaType = response.content?.[OpenAPIContentType.JSON];

      if (!mediaType?.schema || isReference(mediaType.schema)) {
        return;
      }

      const componentName = toResponseComponentName(
        operation.operationId!,
        statusCode,
      );
      schemas[componentName] = mediaType.schema;
      mediaType.schema = toReference(componentName);
    },
  );
}

function toResponseComponentName(operationId: string, statusCode: string) {
  if (SUCCESS_STATUS_CODES.has(statusCode)) {
    return `${toPascalCase(operationId)}Response`;
  }

  const suffix =
    RESPONSE_SUFFIX_BY_STATUS[statusCode] ?? `Status${statusCode}Response`;
  return `${toPascalCase(operationId)}${suffix}`;
}

function isReference(schema: OpenAPISchema) {
  return "$ref" in schema;
}

function toReference(componentName: string) {
  return { $ref: `#/components/schemas/${componentName}` };
}

function toPascalCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
