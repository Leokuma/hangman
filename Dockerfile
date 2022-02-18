FROM denoland/deno:1.19.0

EXPOSE 80

WORKDIR /hangman

USER deno

COPY deps.ts .
RUN deno cache deps.ts

COPY . .
RUN deno cache main.ts

CMD ["run", "--allow-env", "--allow-net", "--cached-only", "--no-check", "main.ts"]