export function createApp() {
  const middlewares = [];

  function use(fn) {
    middlewares.push(fn);
  }

  async function run(request, env, ctx) {
    let index = -1;

    async function next() {
      index++;
      if (index < middlewares.length) {
        return middlewares[index](request, env, ctx, next);
      }
    }

    return next();
  }

  return { use, run };
}