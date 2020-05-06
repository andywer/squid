// To run these tests, run `npm run db:start` in one tab, and
// `npm run test:e2e` in another.

export default {
  files: ["test/*.e2e-test.ts"],
  compileEnhancements: false,
  extensions: ["ts"],
  require: ["ts-node/register"]
}
