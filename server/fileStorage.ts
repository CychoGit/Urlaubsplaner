import fs from 'fs/promises';
import path from 'path';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import { setObjectAclPolicy } from './objectAcl';

/**
 * File Storage Service that supports both Object Storage (Replit) and local filesystem
 * Automatically detects which storage backend is available
 */
export class FileStorageService {
  private useObjectStorage: boolean;
  private objectStorageService?: ObjectStorageService;
  private localStoragePath: string;

  constructor() {
    // Check if Object Storage is available (via environment variables)
    this.useObjectStorage = !!(
      process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID &&
      process.env.PUBLIC_OBJECT_SEARCH_PATHS
    );

    if (this.useObjectStorage) {
      this.objectStorageService = new ObjectStorageService();
      console.log("📦 Using Object Storage for file uploads");
    } else {
      console.log("📁 Using local filesystem for file uploads");
    }

    // Local storage path for production servers
    this.localStoragePath = path.join(process.cwd(), 'uploads', 'logos');
  }

  /**
   * Initialize local storage directory if needed
   */
  async initialize(): Promise<void> {
    if (!this.useObjectStorage) {
      try {
        await fs.mkdir(this.localStoragePath, { recursive: true });
        console.log(`✓ Created uploads directory: ${this.localStoragePath}`);
      } catch (error) {
        console.error("Failed to create uploads directory:", error);
      }
    }
  }

  /**
   * Set ACL policy for an uploaded file
   * @param uploadUrl The URL or path of the uploaded file
   * @param owner The owner ID (user or organization)
   * @returns The normalized file path/URL
   */
  async setFilePolicy(
    uploadUrl: string,
    owner: string,
    visibility: 'public' | 'private' = 'public'
  ): Promise<string> {
    if (this.useObjectStorage && this.objectStorageService) {
      // Use Object Storage (Replit)
      const objectPath = this.objectStorageService.normalizeObjectEntityPath(uploadUrl);
      if (!objectPath) {
        throw new Error("Invalid upload URL");
      }

      // Wait for object to be available
      let objectFile;
      for (let i = 0; i < 10; i++) {
        try {
          objectFile = await this.objectStorageService.getObjectEntityFile(objectPath);
          break;
        } catch (error) {
          if (i === 9) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!objectFile) {
        throw new ObjectNotFoundError();
      }

      // Set ACL policy
      await setObjectAclPolicy(objectFile, {
        owner,
        visibility,
      });

      return objectPath;
    } else {
      // Use local filesystem
      // Extract filename from upload URL
      const filename = path.basename(uploadUrl);
      const localPath = path.join(this.localStoragePath, filename);

      // Return the public URL path for the logo
      return `/uploads/logos/${filename}`;
    }
  }

  /**
   * Generate upload URL for file upload
   * @param fileName The name of the file to upload
   * @param contentType The MIME type of the file
   * @returns Upload URL and object URL
   */
  async getUploadUrl(fileName: string, contentType: string): Promise<{ uploadUrl: string; objectUrl: string }> {
    if (this.useObjectStorage && this.objectStorageService) {
      // Use Object Storage (Replit)
      const uploadUrl = await this.objectStorageService.getObjectEntityUploadURL();
      const objectUrl = this.objectStorageService.normalizeObjectEntityPath(uploadUrl);
      return { uploadUrl, objectUrl };
    } else {
      // Use local filesystem - generate a unique filename
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
      const uploadUrl = `/uploads/logos/${uniqueFileName}`;

      return {
        uploadUrl,
        objectUrl: uploadUrl
      };
    }
  }

  /**
   * Normalize logo URL for organization branding
   */
  async normalizeLogo(
    logoURL: string,
    userId: string
  ): Promise<string | null> {
    if (!logoURL) {
      return null;
    }

    if (this.useObjectStorage && this.objectStorageService) {
      // Use Object Storage
      return await this.objectStorageService.trySetObjectEntityAclPolicy(
        logoURL,
        {
          owner: userId,
          visibility: "public",
        }
      );
    } else {
      // For local filesystem, just return the path as-is
      // It's already in the format /uploads/logos/filename.ext
      return logoURL;
    }
  }
}

export const fileStorageService = new FileStorageService();
