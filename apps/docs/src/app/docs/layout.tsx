import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: 'termprompt',
        url: '/docs',
      }}
      links={[
        {
          text: 'GitHub',
          url: 'https://github.com/seeden/termprompt',
          active: 'nested-url',
        },
        {
          text: 'NPM',
          url: 'https://www.npmjs.com/package/termprompt',
          active: 'nested-url',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
