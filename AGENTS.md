<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- CRM data loads through one public server-function query and mutations use the generated browser client with RLS; this keeps SSR reads portable and access rules centralized.
- Each management section is a separate public route using shared CRM views and shell; this keeps navigation and page metadata distinct.
- Employee ranking and team membership updates use transactional database functions; this avoids partially applied swaps and moves.
