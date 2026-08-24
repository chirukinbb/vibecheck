import axios from 'axios';
import {getServerBaseUrl} from './auth';

export type LanguagesResponse = Record<string, string>;

/** GET /api/languages — справочник поддерживаемых языков */
export async function getLanguages(): Promise<LanguagesResponse> {
  const { data } = await axios.get<LanguagesResponse>(`${getServerBaseUrl()}/api/languages`);
  return data;
}
