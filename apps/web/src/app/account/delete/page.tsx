import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { deleteUserData } from "@/lib/auth-user";

async function deleteAccountAction() {
  "use server";
  const session = await auth();
  if (session?.user?.id) {
    await deleteUserData(session.user.id);
  }
  await signOut({ redirectTo: "/" });
}

export default async function DeleteAccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <section className="panel">
      <h1>Delete your account</h1>
      <p className="lead">
        This permanently deletes your analyses, wardrobe, family profiles, and chat
        history, then signs you out. Required for Google Play account deletion.
      </p>
      <form action={deleteAccountAction}>
        <button className="btn btn-primary" type="submit">
          Delete account &amp; sign out
        </button>
      </form>
    </section>
  );
}
