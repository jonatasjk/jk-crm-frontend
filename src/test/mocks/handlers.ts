import { http, HttpResponse } from 'msw';
import {
  mockInvestors,
  mockPartners,
  mockEmailLogs,
  mockSequences,
  mockMaterials,
  mockUser,
} from './factories';

const BASE = 'http://localhost:3001/api/v1';

export const handlers = [
  // ── Auth ─────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ token: 'test-token', user: mockUser }),
  ),

  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json({ token: 'test-token', user: mockUser }),
  ),

  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ user: mockUser }),
  ),

  http.post(`${BASE}/auth/forgot-password`, () =>
    HttpResponse.json({ message: 'Reset link sent to your email' }),
  ),

  http.post(`${BASE}/auth/reset-password`, () =>
    HttpResponse.json({ success: true }),
  ),

  http.post(`${BASE}/auth/change-password`, () =>
    HttpResponse.json({ success: true }),
  ),

  // ── Investors ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/investors`, () =>
    HttpResponse.json({
      data: mockInvestors,
      total: mockInvestors.length,
      page: 1,
      limit: 200,
      pages: 1,
    }),
  ),

  http.get(`${BASE}/investors/:id`, ({ params }) => {
    const inv = mockInvestors.find((i) => i.id === params.id) ?? mockInvestors[0];
    return HttpResponse.json({ ...inv, emailLogs: [], activities: [] });
  }),

  http.post(`${BASE}/investors`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 'new-investor', tags: [], ...body },
      { status: 201 },
    );
  }),

  http.put(`${BASE}/investors/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const inv = mockInvestors.find((i) => i.id === params.id) ?? mockInvestors[0];
    return HttpResponse.json({ ...inv, ...body });
  }),

  http.delete(`${BASE}/investors/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${BASE}/investors/import`, () =>
    HttpResponse.json({ created: 2, updated: 0, errors: [], parseErrors: [], total: 2 }),
  ),

  // ── Partners ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/partners`, () =>
    HttpResponse.json({
      data: mockPartners,
      total: mockPartners.length,
      page: 1,
      limit: 200,
      pages: 1,
    }),
  ),

  http.get(`${BASE}/partners/:id`, ({ params }) => {
    const partner = mockPartners.find((p) => p.id === params.id) ?? mockPartners[0];
    return HttpResponse.json({ ...partner, emailLogs: [], activities: [] });
  }),

  http.post(`${BASE}/partners`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 'new-partner', tags: [], ...body },
      { status: 201 },
    );
  }),

  http.put(`${BASE}/partners/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const partner = mockPartners.find((p) => p.id === params.id) ?? mockPartners[0];
    return HttpResponse.json({ ...partner, ...body });
  }),

  http.delete(`${BASE}/partners/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${BASE}/partners/import`, () =>
    HttpResponse.json({ created: 1, updated: 0, errors: [], parseErrors: [], total: 1 }),
  ),

  // ── Email ─────────────────────────────────────────────────────────────────
  http.post(`${BASE}/email/send`, () =>
    HttpResponse.json({ success: true, messageId: 'msg-1', emailLogId: 'log-1' }),
  ),

  http.get(`${BASE}/email/logs`, () =>
    HttpResponse.json(mockEmailLogs),
  ),

  http.get(`${BASE}/email/logs/:entityType/:entityId`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${BASE}/email/stats`, () =>
    HttpResponse.json({ sentToday: 5 }),
  ),

  // ── Sequences ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/sequences`, () =>
    HttpResponse.json(mockSequences),
  ),

  http.get(`${BASE}/sequences/:id`, ({ params }) => {
    const seq = mockSequences.find((s) => s.id === params.id) ?? mockSequences[0];
    return HttpResponse.json(seq);
  }),

  http.post(`${BASE}/sequences`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'new-seq',
        steps: [],
        enrollments: { total: 0, active: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...body,
      },
      { status: 201 },
    );
  }),

  http.put(`${BASE}/sequences/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const seq = mockSequences.find((s) => s.id === params.id) ?? mockSequences[0];
    return HttpResponse.json({ ...seq, ...body });
  }),

  http.delete(`${BASE}/sequences/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${BASE}/sequences/:id/enrollments`, () =>
    HttpResponse.json([]),
  ),

  http.post(`${BASE}/sequences/:id/enroll`, () =>
    HttpResponse.json({ id: 'enroll-1', status: 'ACTIVE' }),
  ),

  http.post(`${BASE}/sequences/:id/enroll-all`, () =>
    HttpResponse.json({ enrolled: 2, skipped: 0 }),
  ),

  http.post(`${BASE}/enrollments/:id/unenroll`, () =>
    HttpResponse.json({ id: 'enroll-1', status: 'UNSUBSCRIBED' }),
  ),

  http.post(`${BASE}/enrollments/:id/replied`, () =>
    HttpResponse.json({ id: 'enroll-1', status: 'REPLIED' }),
  ),

  // ── Materials ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/materials`, () =>
    HttpResponse.json(mockMaterials),
  ),

  http.post(`${BASE}/materials/upload`, () =>
    HttpResponse.json(mockMaterials[0], { status: 201 }),
  ),

  http.get(`${BASE}/materials/:id/download`, () =>
    new HttpResponse(new Blob(['file content'], { type: 'application/pdf' }), {
      headers: { 'Content-Type': 'application/pdf' },
    }),
  ),

  http.delete(`${BASE}/materials/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
