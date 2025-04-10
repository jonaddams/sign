import Link from "next/link";

const Error: React.FC = () => {
  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8 2xl:max-w-screen-2xl">
      <section className="hero w-full p-8 text-center">
        <h2 className="mb-4 text-xl">
          An error occurred during authentication.
        </h2>
        <p className="mb-4">Please try again.</p>
        <Link href="/auth/sign-in">
          <button className="rounded-sm bg-blue-600 px-4 py-2 text-white">
            Sign In
          </button>
        </Link>
      </section>
    </main>
  );
};

export default Error;
