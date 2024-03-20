import type { FC } from "hono/jsx";
import { Context } from "hono";
import { Var } from "../types/Var";
import { Env } from "../types/Env";
import Layout from "./components/Layout";

const Button: FC<{}> = ({ children }) => {
  return (
    <button
      class="relative w-full rounded-lg text-center px-4 py-5 bg-primary text-textOnPrimary hover:bg-primaryHover text-base sm:mt-4 md:text-base"
      type="submit"
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </button>
  );
};

const ResetPasswordPage: FC<{}> = (props: {}) => {
  return (
    <Layout title="Reset Password">
      <div class="mb-8 text-2xl font-medium">Reset password</div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post">
          <input
            type="text"
            name="password"
            placeholder="enter new password"
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {/* TODO - display error here */}
          {/* {!!error && <em class="mb-2 bg-red">{error}</e  m>} */}
          {/* TODO - copy Button component over and use this */}
          <Button>Change password</Button>
        </form>
      </div>
    </Layout>
  );
};

export async function renderReactThing(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  // we could make app.ts into app.tsx and render the JSX there directly...
  // I figure we should have a JSX-only file that adds lots of routes?
  return ctx.html(<ResetPasswordPage />);
}