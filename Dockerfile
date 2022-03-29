FROM denoland/deno:1.20.3

EXPOSE 80

WORKDIR /hangman

USER deno

COPY deps.ts .
RUN deno cache deps.ts

COPY . .
RUN deno cache start.ts

CMD ["run", "--allow-env", "--allow-net", "--cached-only", "--no-check", "start.ts"]