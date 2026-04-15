/**
 * Api response common object
 */
export const responseCommonObject = {
  id: {
    type: 'number',
    example: 1,
  },
  creator: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
    },
  },
  updator: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
    },
  },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
  updatedAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
};
