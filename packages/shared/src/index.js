import createClient from "openapi-fetch";
export function createApiClient(baseUrl = "") {
    return createClient({ baseUrl });
}
