import AgentLayoutClient from '@/app/component/AgentLayoutClient';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentLayoutClient>{children}</AgentLayoutClient>;
}