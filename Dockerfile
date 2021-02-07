FROM hayd/deno:1.7.0

EXPOSE 80

WORKDIR /hangman

USER deno

COPY deps.js .
RUN deno cache deps.js

COPY . .
RUN deno cache main.js

CMD ["run", "--allow-read", "--allow-env", "--allow-net", "--cached-only", "--no-check", "main.js"]