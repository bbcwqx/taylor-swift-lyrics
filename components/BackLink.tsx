import { Undo2 } from "lucide-preact";

type BackLinkProps = {
  href: string;
  children: string;
};

export default function BackLink({ href, children }: BackLinkProps) {
  return (
    <a
      href={href}
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline mb-4"
    >
      <Undo2 class="w-4 h-4" />
      {children}
    </a>
  );
}
