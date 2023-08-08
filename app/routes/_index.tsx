import type { ActionArgs, V2_MetaFunction } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { PromptForm } from "~/components/prompt-form";
import { run } from "~/features/store.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Langchain Document Explainer" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function action({ request }: ActionArgs) {
  const body = await request.formData();

  console.log(body.get("prompt"));
  const j = await run(body.get("prompt") as string);

  return { j };
}

export default function Index() {
  const actionD = useActionData<typeof action>();

  return (
    <main>
      <div className="max-w-xl mx-auto">
        <p>{actionD?.j.text}</p>
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
        <div className="max-w-xl mx-auto">
          <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
            <PromptForm />
          </div>
        </div>
      </div>
    </main>
  );
}
