FROM denoland/deno:1.28.1

EXPOSE 80

WORKDIR /hangman

USER deno

COPY deps.ts .
RUN deno cache --no-lock deps.ts

COPY . .
RUN deno cache --no-lock start.ts

CMD ["run", "--allow-env", "--allow-net", "--cached-only", "--no-lock", "start.ts"]