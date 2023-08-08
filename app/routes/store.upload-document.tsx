import {
  unstable_composeUploadHandlers,
  type ActionArgs,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { updateVectorStore } from "~/features/store.server";

export async function action({ request }: ActionArgs) {
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      directory: "public/documents",
      avoidFileConflicts: true,
      maxPartSize: 5_000_000,
      file: ({ filename }) => filename.replaceAll(" ", "_"),
    }),
    // parse everything else into memory
    unstable_createMemoryUploadHandler()
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  // const formData = await request.formData();

  const file = formData.get("file") as File;

  let errors: any = null;
  try {
    const k = await updateVectorStore();

    return { file, k, errors };
  } catch (error) {
    errors = error;
  }

  return { file, errors };
}

export default function UploadDocument() {
  const actionD = useActionData<typeof action>();

  console.log(actionD);

  return (
    <div>
      <form method="POST" encType="multipart/form-data">
        <input type="file" name="file" />
        <Button>Submit</Button>
      </form>
    </div>
  );
}
