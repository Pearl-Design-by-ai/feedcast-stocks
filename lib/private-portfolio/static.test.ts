/**
 * Static guards for the private portfolio: the migration keeps the table
 * owner-read-only, and the route never leaks into the sitemap.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';

const root = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const sql = read('supabase/migrations/009_private_portfolio.sql')
    .replace(/--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

describe('009_private_portfolio.sql', () => {
    it('enables and forces RLS', () => {
        expect(sql).toContain('alter table public.private_portfolio_documents enable row level security');
        expect(sql).toContain('alter table public.private_portfolio_documents force row level security');
    });
    it('has exactly one policy: select-only, owner-scoped', () => {
        const policies = sql.match(/create policy [^;]+;/g) ?? [];
        expect(policies).toHaveLength(1);
        expect(policies[0]).toMatch(/for select to authenticated using \(auth\.uid\(\) = user_id\)/);
        expect(policies[0]).not.toMatch(/with check|for (all|insert|update|delete)/);
    });
    it('revokes from anon and grants authenticated only select', () => {
        expect(sql).toMatch(/revoke all on table public\.private_portfolio_documents from anon, authenticated/);
        expect(sql).toContain('grant select on table public.private_portfolio_documents to authenticated;');
        expect(sql).not.toMatch(/grant [^;]* to [^;]*anon/);
        expect(sql).not.toMatch(/grant [^;]*(insert|update|delete)[^;]* to authenticated/);
    });
    it('is purely additive', () => {
        expect(sql).not.toMatch(/\b(drop|delete from|truncate|create (or replace )?function|create trigger)\b/);
    });
});

describe('route exposure', () => {
    it('keeps /my-portfolio out of the sitemap', () => {
        expect(read('app/sitemap.ts')).not.toContain('my-portfolio');
    });
    it('disallows /my-portfolio in robots', () => {
        const rules = robots().rules;
        const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow;
        expect(disallow).toContain('/my-portfolio');
    });
    it('has no API route for the private portfolio', () => {
        const walk = (d: string): string[] =>
            readdirSync(join(root, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
        const hits = walk('app/api').filter((f) => /private-portfolio|my-portfolio|private_portfolio/.test(f + read(f)));
        expect(hits).toEqual([]);
    });
});
