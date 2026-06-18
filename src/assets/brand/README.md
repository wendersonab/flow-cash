# Assets da marca FlowCash

Cole/substitua os arquivos finais da marca nesta pasta usando exatamente estes nomes:

- `icon.png` — símbolo usado ao lado do texto "FlowCash" no header, login, sidebar e demais telas.
- `icon.ico` — favicon principal do navegador.

Importante: o texto "FlowCash" não deve vir dentro da imagem da logo do site. Ele fica como texto real no componente `Logo`, para mudar corretamente entre tema claro/escuro e manter melhor responsividade.

Depois de substituir os arquivos, rode novamente:

```bash
npm run dev
```

ou, para produção:

```bash
npm run build
```

O script `scripts/sync-brand-assets.mjs` copia automaticamente `icon.ico` para `public/icon.ico` e `icon.png` para `public/brand/icon.png`.
