# Ford Ranger Raptor

Vitrine da Ford Ranger Raptor para a banca. O app é uma SPA em React e Vite: início com o modelo 3D, especificações e relatório. O APK de debug empacota esse build e abre o app local, sem apontar para o computador de desenvolvimento.

## Pré-requisitos

- Node.js 22.13 ou mais novo
- JDK 21
- Android SDK com a plataforma 36 e o build-tools 36
- Um celular Android ou um emulador, com a depuração USB ligada se for instalar por cabo

## Rodar no navegador

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar. As três telas são início, Ver Specs e Relatório.

## Gerar o APK

O arquivo entregue é um APK de debug, assinado com a chave de debug da máquina. Não é um pacote da Play Store.

```bash
npm run android:apk
```

Esse comando gera o `dist`, copia para o projeto Android e roda `assembleDebug`. O APK fica em:

`android/app/build/outputs/apk/debug/app-debug.apk`

`android/local.properties` precisa apontar o SDK (`sdk.dir`). O Capacitor não usa `server.url`: o WebView abre o app empacotado.

## Instalar

Com o celular ou o emulador visível em `adb devices`:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

No celular, também dá para copiar o APK e abri-lo no gerenciador de arquivos. Se o Android bloquear, permita a instalação dessa fonte.

O botão voltar do Android sai do relatório para as especificações, das especificações para o início, e no início fecha o app.

## O que entra no pacote

O modelo, o mapa de luz e as fontes Inter e Bebas Neue vão dentro do app. Arquivos de oficina que a vitrine não usa ficam em `workshop/unused-public/` e não entram no APK.
