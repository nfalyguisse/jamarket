import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface UploadImagesResponse {
  vehiculeId: number;
  uploaded: number;
  images: { id: number; url: string }[];
}

@Injectable({ providedIn: 'root' })
export class AdminUploadApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehicules`;

  uploadImages(vehiculeId: number, files: File[]): Observable<UploadImagesResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    return this.http.post<UploadImagesResponse>(
      `${this.baseUrl}/${vehiculeId}/images`,
      formData,
    );
  }

  deleteImage(vehiculeId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${vehiculeId}/images/${imageId}`);
  }
}
