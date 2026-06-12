export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Service to interact with Google Drive v3 API from client side using OAuth 2.0 Access Token.
 */
export class GoogleDriveService {
  /**
   * Finds or creates the PestGuard AI Reports folder.
   */
  static async findOrCreateFolder(token: string, folderName = "PestGuard AI Reports"): Promise<string> {
    try {
      // 1. Search for existing folder
      const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!searchRes.ok) {
        throw new Error(`Search folder failed: ${searchRes.statusText}`);
      }
      
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }
      
      // 2. Folder does not exist, create it
      const createUrl = 'https://www.googleapis.com/drive/v3/files';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      
      if (!createRes.ok) {
        throw new Error(`Create folder failed: ${createRes.statusText}`);
      }
      
      const folderData = await createRes.json();
      return folderData.id;
    } catch (error) {
      console.error('Error in findOrCreateFolder:', error);
      throw error;
    }
  }

  /**
   * Lists JSON reports inside our app folder.
   */
  static async listReports(token: string, folderId: string): Promise<DriveFile[]> {
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,size,webViewLink)&orderBy=createdTime desc`;
      
      const res = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`List files failed: ${res.statusText}`);
      }
      
      const data = await res.json();
      return data.files || [];
    } catch (error) {
      console.error('Error in listReports:', error);
      throw error;
    }
  }

  /**
   * Uploads a detection report to Google Drive inside the PestGuard folder.
   */
  static async uploadReportFile(
    token: string,
    folderId: string,
    filename: string,
    reportData: any
  ): Promise<DriveFile> {
    try {
      // 1. Create Metadata
      const metaUrl = 'https://www.googleapis.com/drive/v3/files';
      const metaRes = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: filename,
          mimeType: 'application/json',
          parents: [folderId]
        })
      });
      
      if (!metaRes.ok) {
        throw new Error(`Meta creation failed: ${metaRes.statusText}`);
      }
      
      const metaData = await metaRes.json();
      const fileId = metaData.id;
      
      // 2. Upload Content Media
      const mediaUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const mediaRes = await fetch(mediaUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData, null, 2)
      });
      
      if (!mediaRes.ok) {
        throw new Error(`Media upload failed: ${mediaRes.statusText}`);
      }
      
      // 3. Fetch webViewLink for the file so we can show link to download
      const getFileUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,createdTime,size,webViewLink`;
      const fileRes = await fetch(getFileUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return await fileRes.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Deletes a file with a confirmation dialog handling.
   */
  static async deleteFile(token: string, fileId: string): Promise<boolean> {
    try {
      const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return res.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}
