# speedi

Speedy, all-in-one web application framework

## Initialization

Before the app can run, `Config` object should be initialized with the `init` function. This function returns a promise that if fulfilled, the app can be created.

The argument to the `init` function should be an object with the following format:

```typescript
{
    amqp: object({
        host: string().required(),
        password: string().optional().default('guest'),
        port: number().optional().default(5672),
        protocol: string().optional().default('amqp'),
        username: string().optional().default('guest'),
    }).optional(),
    app: object({
        nodeEnv: string().optional().default('development'),
    }).optional().default({
        nodeEnv: 'development',
    }),
    authentication: object({
        secretKey: string().required(),
        tokenLifeTime: number().optional().default(30 * 24 * 60 * 60 * 1000),
    }).required(),
    dataStore: object({
        prefix: string().empty('').optional().default(''),
        type: string().optional().default('redis'),
    }).optional().default({
        prefix: '',
        type: 'redis',
    }),
    redis: object({
        host: string().required(),
        password: string().empty('').optional().default(''),
        port: number().optional().default(6379),
        protocol: string().empty('').optional().default(''),
        username: string().empty('').optional().default(''),
    }).required(),
}
```

For example:

```typescript
Config.init({
    amqp: {
        host: '127.0.0.1',
    },
    authentication: {
        secretKey: 'abcdefg',
    },
    redis: {
        host: '127.0.0.1',
    },
});
```

## Creating an App

After `Config` object is initialized and the returning promise is fulfilled, the app can be created.

```typescript
const app = new App(options);
```

`options` for the app includes an string `name`, an optional `http` server options, and an optional `rpc` server options. `http` server options should be in the following format.

```typescript
http: {
    host: string;
    port: number;
    protocol?: 'http' | 'https';
}
```

`rpc` server options should be in the foloowing format:

```typescript
rpc: {
    queueNames: string[];
}
```

An example for creating an app is as follows:

```typescript
const app = new App({
    http: {
        host: '127.0.0.1',
        port: 9000,
        protocol: 'http',
    },
    name: 'testApp',
    rpc: {
        queueNames: ['local_test_queue'],
    },
});
```

## Running the App

To run the app, `run` method should be called. For example:

```typescript
app.run();
```

## Adding a Route

To add a route to all defined servers, `addRoutes` method on the app instance should be called with an object implementing the following interface. This methods accepts both a single route options objects and array of them.

```typescript
interface IRouteOptions {
    name: string;
    description: string;
    method: RouteMethod;
    path: string;
    controller: (...args: any[]) => Promise<any>;
    authentication?: IAuthenticationOptions;
    payload?: (request: express.Request) => any;
    validate?: Joi.SchemaMap;
    rateLimit?: IRateLimiterOptions;
    cache?: ICacherOptions;
}
```

Route method accepts values from `RouteMethod`  enum with the following definition:

```typescript
enum RouteMethod {
    Get,
    Post,
    Put,
    Patch,
    Delete,
}
```

`controller` must be an async function (returns a promise) and it will be called with the object returned from the `payload` function.

`authentication` object should implement the following interface:

```typescript
interface IAuthenticationOptions {
    customAuthenticator?: (token: IAuthenticationToken) => boolean;
    renewToken?: boolean;
    roles: string[];
}
```

`rateLimit` object should implement the following interface:

```typescript
interface IRateLimiterOptions {
    duration: number;
    allowedBeforeDelay: number;
    maximumDelay: number;
    allowedBeforeLimit: number;
    message?: string;
    keyGenerator?: (req: express.Request | IRpcRequest) => string;
    key: string;
}
```

`cache` object should implement the following interface:

```typescript
interface ICacherOptions {
    expire: number;
    authBased: boolean;
}
```

Below is an example of adding a route:

```typescript
app.addRoutes({
    authentication: {
        renewToken: true,
        roles: ['user'],
    },
    cache: {
        authBased: false,
        expire: 10,
    },
    controller: async ({ id, name }) => {
        return {
            id,
            message: `Hello ${name}!`,
            timestamp: Date.now(),
        };
    },
    description: 'Get user information',
    method: RouteMethod.Post,
    name: 'get_user',
    path: '/user/:id',
    payload: (req) => ({
        id: req.params.id,
        name: req.body.name,
    }),
    rateLimit: {
        allowedBeforeDelay: 10,
        allowedBeforeLimit: 20,
        duration: 60,
        key: '',
        maximumDelay: 30 * 1000,
    },
    validate: {
        id: Joi.string().required(),
        name: Joi.string().required(),
    },
});
```

## Send RPC Request to Other Services

To communicate between services, RPC requests can be sent using the `send` method of the `RpcSender` class. The method is an async function that returns a promised, which if fulfilled, contains the response for the request. The argument for the `send` method should implement the following interface:

```typescript
IRpcSenderRequest {
    service: string;
    name?: string;
    method?: RouteMethod;
    path?: string;
    authenticationToken?: string;
    payload?: any;
}
```

An example of sending an RPC request to a service called `local_test_queue` and a processor (e.g., route) called `local_test_queue`:

```typescript
const response = await RpcSender.send({
    authenticationToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikprg0ofdyjjQbS1HEPr3xhM',
    name: 'create_user',
    payload: {
        id: '123',
        name: 'Dear User',
    },
    service: 'user_management',
});
```