import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import ws from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServer, gql } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import expressPlayground from "graphql-playground-middleware-express";

import { MessageResolver } from './types';

const MESSAGE_CREATED = 'MESSAGE_CREATED';

(async () => {
    const app = express();
    const httpServer = createServer(app);

    const pubSub = new PubSub();

    const schema = await buildSchema({
        resolvers: [MessageResolver],
        pubSub
    });

    const server = new ApolloServer({
        schema
    });

    await server.start()

    server.applyMiddleware({ app, path: '/graphql' });

    app.get("/playground", expressPlayground({
        endpoint: '/graphql',
    }));

    httpServer.listen({ port: 8000 }, () => {
        const ws_server = new ws.Server({
            server: httpServer,
            path: '/graphql',
        });

        useServer(
            { schema },
            ws_server
        );

        console.log('Apollo Server on http://localhost:8000/graphql');
    });

    let id = 2;

    setInterval(() => {
        pubSub.publish(MESSAGE_CREATED, {
            messageCreated: { id, content: new Date().toString() },
        });

        id++;
    }, 1000);
})();
