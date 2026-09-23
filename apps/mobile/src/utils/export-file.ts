import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";

import { buildApiUrl } from "../api/client";
import { expireSession } from "../session/session";

type DownloadAndShareOptions = {
  path: string;
  filename: string;
  mimeType: string;
  dialogTitle?: string;
};

function sanitizeFilename(filename: string) {
  return filename.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-");
}

export async function downloadAndShareFile({
  path,
  filename,
  mimeType,
  dialogTitle = "Partager le document",
}: DownloadAndShareOptions): Promise<void> {
  const token = await SecureStore.getItemAsync("accessToken");

  if (!token) {
    throw new Error("Utilisateur non authentifié.");
  }

  const directory = FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error(
      "Le stockage temporaire de l'appareil n'est pas disponible.",
    );
  }

  const localUri = `${directory}${sanitizeFilename(filename)}`;

  // Supprime éventuellement une ancienne version du même export.
  await FileSystem.deleteAsync(localUri, {
    idempotent: true,
  });

  const result = await FileSystem.downloadAsync(
    buildApiUrl(path),
    localUri,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: mimeType,
      },
    },
  );

  if (result.status === 401) {
  await FileSystem.deleteAsync(localUri, {
    idempotent: true,
  });

  await expireSession();

  throw new Error("SESSION_EXPIRED");
}

  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(localUri, {
      idempotent: true,
    });

    throw new Error(
      `Le serveur n'a pas pu générer le document (${result.status}).`,
    );
  }

  const info = await FileSystem.getInfoAsync(result.uri);

  if (!info.exists) {
    throw new Error(
      "Le document a été généré mais n'a pas pu être enregistré sur l'appareil.",
    );
  }

  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error(
      "Le partage de fichiers n'est pas disponible sur cet appareil.",
    );
  }

  await Sharing.shareAsync(result.uri, {
    mimeType,
    dialogTitle,
    UTI:
      mimeType === "application/pdf"
        ? "com.adobe.pdf"
        : "org.openxmlformats.spreadsheetml.sheet",
  });
}