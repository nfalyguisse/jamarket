import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ConversationDetail,
  ConversationSummary,
  CreateConversationPayload,
} from '@core/models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/conversations`;

  list(): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>(this.baseUrl);
  }

  getById(id: number, params?: { limit?: number; offset?: number }): Observable<ConversationDetail> {
    return this.http.get<ConversationDetail>(`${this.baseUrl}/${id}`, {
      params: {
        ...(params?.limit != null ? { limit: String(params.limit) } : {}),
        ...(params?.offset != null ? { offset: String(params.offset) } : {}),
      },
    });
  }

  create(payload: CreateConversationPayload): Observable<ConversationDetail> {
    return this.http.post<ConversationDetail>(this.baseUrl, payload);
  }
}
