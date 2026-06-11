import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Pequeno envoltorio sobre HttpClient para reutilizar la URL base de la API.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  get<T>(recurso: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${recurso}`);
  }

  post<T>(recurso: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${recurso}`, cuerpo);
  }
}
