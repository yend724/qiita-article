---
title: 手ブレ写真が撮れるウェブアプリを作った
tags:
  - HTML
  - CSS
  - JavaScript
  - TypeScript
private: false
updated_at: '2024-12-03T18:22:20+09:00'
id: 2a9d75c57566049f0325
organization_url_name: null
slide: false
ignorePublish: false
---

:::note info
本記事は[クソアプリ Advent Calendar 2024](https://qiita.com/advent-calendar/2024/kuso-app)の4日目の記事です。
:::

クソアプリAdvent Calendarに参加してみたかったので作りました。手ブレ写真が撮れるウェブアプリです。何の役にも立ちません。

## 今回作ったアプリ

「**Shake Snap**」と名付けました。

デバイスを振ることで写真を撮影できます。スマートフォンでの利用を想定しています。スマートフォンでなくとも加速度センサーを内蔵しているデバイスであれば利用できると思いますが、検証は手元のiPhone 12 miniでのみ行っています。

<details>
<summary>アニメーションGIFでアプリの動作を確認する</summary>

![20241204_shake_snap_01.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/1851508/8f1c20f8-6be0-3861-6b90-6eac4ffec16b.gif)
</details>

アプリのURL:

https://shake-snap.yend.dev/

ソースコード:

https://github.com/yend724/shake-snap

## 使用した技術

Viteを使ってサクッと作りました。テンプレートは[vanilla-ts](https://stackblitz.com/edit/vitejs-vite-r9dd5g?file=index.html&terminal=dev)です。始めはCSSをスクラッチで書いていたのですが、途中から書くのが面倒になったのでTailwind CSSを導入しました。

- [Vite(vanilla-ts)](https://ja.vite.dev/guide/#trying-vite-online)
- [Tailwind CSS](https://tailwindcss.com/)

## コア機能の解説

ここではアプリのコア機能である次の2点について簡単に説明します。

- カメラを使った写真の撮影
- デバイスの振動判定

### カメラを使った写真の撮影

デバイスのカメラ利用は、`mediaDevices.getUserMedia()`を使いました。このメソッドでカメラから映像ストリームを取得し、それを`<video>`要素に流し込んでいます。

```ts:/src/assets/js/camera.ts
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false,
  });
  this.#videoElement.srcObject = stream;
  this.#onCameraStart();
  return true;
} catch (error) {
  console.error(error);
  alert(
    'カメラの起動に失敗しました。カメラへのアクセスを許可してください。'
  );
}
```

写真の撮影は`<canvas>`を使っています。`<video>`の現在のフレームをキャプチャして、`toDataURL()`で画像をデータURLに変換しています。

```ts:/src/assets/js/camera.ts
capture(ctx: CanvasRenderingContext2D): string {
  const canvas = ctx.canvas;
  canvas.width = this.#videoElement.videoWidth;
  canvas.height = this.#videoElement.videoHeight;
  ctx.drawImage(this.#videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg');
}
```

### デバイスの振動判定

デバイスの振動検出では`DeviceMotionEvent`を利用しました。

`acceleration`の値を取得し、X・Y・Z軸方向の加速度を基に、振動の強さを計算しています。計算のロジックは単純で、加速度ベクトルの大きさを求めているだけです。

振動の強さが閾値を超えた場合、写真の撮影をトリガーします。

```ts
const handler = (event: DeviceMotionEvent) => {
  const { acceleration } = event;
  const x = acceleration?.x ?? 0;
  const y = acceleration?.y ?? 0;
  const z = acceleration?.z ?? 0;
  const totalAcceleration = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  this.#onShake(totalAcceleration);

  if (totalAcceleration > 0) {
    this.#isShaken = true;
  }
};

window.addEventListener(
  'devicemotion',
  event => {
    requestAnimationFrame(() => handler(event));
  },
  {
    passive: true,
  }
);
```

また現状のiOSデバイス（iOS13以降？）では`DeviceDeviceMotionEvent`を使用するためにユーザーへの権限のリクエストが必要です。つまり明示的に`DeviceMotionEvent.requestPermission()`を実行する必要があります。

```ts
#getRequestPermission() {
  const requestPermission = (
    DeviceMotionEvent as unknown as DeviceMotionEventIOS
  ).requestPermission;
  const isRequestNeeded = typeof requestPermission === 'function';

  if (!isRequestNeeded) {
    return async () => 'granted' as const;
  }
  return requestPermission;
}

async requestPermission(): Promise<boolean> {
  const requestPermission = this.#getRequestPermission();

  try {
    const permissionState = await requestPermission();
    if (permissionState === 'granted') {
      this.#onPermissionGranted();
      this.#registerEventHandlers();
      return true;
    } else {
      alert('加速度センサーの許可が得られませんでした');
      console.warn('permissionState:', permissionState);
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}
```

以上の流れで、デバイスの振動を検知し、写真の撮影を行っています。

## おわりに

クソアプリAdvent Calendarには今回はじめて参加したこともあり、楽しみながら実装できました。アイディア出しはAIに手伝ってもらいました。

短い期間で役に立たないアプリを作ることに焦点を当てていため、技術的な深掘りをほとんどできなかったことが今回の反省点です。もしまた参加する機会があれば、技術的な工夫も取り入れながら取り組みたいと思います。

## 参考

- [Window: devicemotion イベント - Web API | MDN](https://developer.mozilla.org/ja/docs/Web/API/Window/devicemotion_event)
- [MediaDevices: getUserMedia() メソッド - Web API | MDN](https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia)
