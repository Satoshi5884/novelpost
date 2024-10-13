import React, { useState } from 'react';

const HelpPage = () => {
  const [language, setLanguage] = useState('ja');

  const content = {
    ja: {
      title: "NovelPostヘルプ",
      htmlTags: {
        title: "使用可能なHTMLタグ",
        intro: "NovelPostでは、以下のHTMLタグとカスタムタグを使用して投稿をフォーマットすることができます：",
        tags: [
          { tag: "<p>", description: "段落を作成します", example: "<p>これは新しい段落です。</p>" },
          { tag: "<br>", description: "改行を挿入します", example: "1行目<br>2行目" },
          { tag: "<h1> から <h6>", description: "見出しを作成します", example: "<h2>第1章: 始まり</h2>" },
          { tag: "<b> または <strong>", description: "テキストを太字にします", example: "これは<b>重要な</b>ポイントです。" },
          { tag: "<i> または <em>", description: "テキストを斜体にします", example: "彼女は<i>ゆっくりと</i>振り返った。" },
          { tag: "<u>", description: "テキストに下線を引きます", example: "これは<u>重要な</u>部分です。" },
          { tag: "<blockquote>", description: "引用文をフォーマットします", example: `<blockquote>「人生は短い」と彼女は言った。</blockquote>` },
          { tag: "<pre>", description: "整形済みテキストを表示します", example: "<pre>  これは\n    整形済み\n      テキストです</pre>" },
          { tag: "<code>", description: "コードスニペットを表示します", example: "<code>const greeting = 'Hello, World!';</code>" },
          { tag: "<ul> と <li>", description: "順序なしリストを作成します", example: "<ul><li>項目1</li><li>項目2</li></ul>" },
          { tag: "<ol> と <li>", description: "順序付きリストを作成します", example: "<ol><li>最初の項目</li><li>2番目の項目</li></ol>" },
          { tag: "[novel-image id=\"画像ID\"]", description: "アップロードした画像を本文中に挿入します", example: "[novel-image id=\"1234567890\"]" },
          { tag: "<a href=\"リンク先のパス\">アンカーテキスト</a>", description: "ハイパーリンクを挿入します。ユーザーがクリックすると指定したパスに移動します。", example: "<a href=\"/about\">私たちについて</a>" },
        ],
      },
      imageWarning: "注意: セキュリティ上の理由から、外部URLからの画像の直接埋め込みはサポートされていません。代わりに、[novel-image id=\"画像ID\"]タグを使用してアップロードした画像を表示してください。",
      exampleUsage: {
        title: "使用例",
        intro: "これらのタグを使用して小説を書く例を以下に示します：",
      },
      needMoreHelp: {
        title: "さらにヘルプが必要ですか？",
        content: "ご質問がある場合や更なるサポートが必要な場合は、お気軽にサポートチームまでお問い合わせください。"
      },
      languageSwitch: "Switch to English"
    },
    en: {
      title: "NovelPost Help",
      htmlTags: {
        title: "Available HTML Tags",
        intro: "In NovelPost, you can use the following HTML tags and custom tags to format your posts:",
        tags: [
          { tag: "<p>", description: "Creates a paragraph", example: "<p>This is a new paragraph.</p>" },
          { tag: "<br>", description: "Inserts a line break", example: "Line 1<br>Line 2" },
          { tag: "<h1> to <h6>", description: "Creates headings", example: "<h2>Chapter 1: The Beginning</h2>" },
          { tag: "<b> or <strong>", description: "Makes text bold", example: "This is an <b>important</b> point." },
          { tag: "<i> or <em>", description: "Italicizes text", example: "She turned around <i>slowly</i>." },
          { tag: "<u>", description: "Underlines text", example: "This is an <u>important</u> section." },
          { tag: "<blockquote>", description: "Formats a quotation", example: `<blockquote>"Life is short," she said.</blockquote>` },
          { tag: "<pre>", description: "Displays preformatted text", example: "<pre>  This is\n    preformatted\n      text</pre>" },
          { tag: "<code>", description: "Displays a code snippet", example: "<code>const greeting = 'Hello, World!';</code>" },
          { tag: "<ul> and <li>", description: "Creates an unordered list", example: "<ul><li>Item 1</li><li>Item 2</li></ul>" },
          { tag: "<ol> and <li>", description: "Creates an ordered list", example: "<ol><li>First item</li><li>Second item</li></ol>" },
          { tag: "[novel-image id=\"imageID\"]", description: "Inserts an uploaded image into the main text", example: "[novel-image id=\"1234567890\"]" },
          { tag: "<a href=\"path\">Anchor Text</a>", description: "Inserts a hyperlink. When clicked, users are directed to the specified path.", example: "<a href=\"/about\">About Us</a>" },
        ],
      },
      imageWarning: "Note: For security reasons, direct embedding of images from external URLs is not supported. Instead, use the [novel-image id=\"imageID\"] tag to display uploaded images in the main text.",
      exampleUsage: {
        title: "Example Usage",
        intro: "Here's an example of how you might use these tags in your novel:",
      },
      needMoreHelp: {
        title: "Need More Help?",
        content: "If you have any questions or need further assistance, please don't hesitate to contact our support team."
      },
      languageSwitch: "日本語に切り替え"
    }
  };

  const currentContent = content[language];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary">{currentContent.title}</h1>
        <button
          onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
          className="px-4 py-2 bg-secondary text-white rounded hover:bg-primary transition duration-300"
        >
          {currentContent.languageSwitch}
        </button>
      </div>
      
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{currentContent.htmlTags.title}</h2>
        <p>{currentContent.htmlTags.intro}</p>
        <table className="w-full mt-4 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">タグ</th>
              <th className="border border-gray-300 px-4 py-2">説明</th>
              <th className="border border-gray-300 px-4 py-2">例</th>
            </tr>
          </thead>
          <tbody>
            {currentContent.htmlTags.tags.map((tag, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2"><code>{tag.tag}</code></td>
                <td className="border border-gray-300 px-4 py-2">{tag.description}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <code>{tag.example}</code>
                  <br />
                  <span dangerouslySetInnerHTML={{ __html: tag.example }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-red-500">{currentContent.imageWarning}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{currentContent.exampleUsage.title}</h2>
        <p>{currentContent.exampleUsage.intro}</p>
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <code>
{`<h2>${language === 'ja' ? '第1章: 始まり' : 'Chapter 1: The Beginning'}</h2>

<p>${language === 'ja' ? 'それは<b>暗く嵐の夜</b>だった。風が木々を通り抜け、サラの背筋に震えを走らせた。' : 'It was a <b>dark and stormy</b> night. The wind howled through the trees, sending shivers down Sarah\'s spine.'}</p>

<img-novel id="stormyNight" />

<p>${language === 'ja' ? '「信じられない、こんなことをしているなんて」' : '"I can\'t believe I\'m doing this,"'} ${language === 'ja' ? '彼女は自分に言い聞かせた。' : 'she muttered to herself.'}</p>

<blockquote>${language === 'ja' ? '「時として、最も勇敢な行動は未知の世界への第一歩を踏み出すことだ」' : '"Sometimes, the bravest thing we can do is take that first step into the unknown."'}</blockquote>

<p>${language === 'ja' ? '祖母の言葉が彼女の心に響き、前進する勇気を与えた。深呼吸をして、サラは<i>廃屋</i>に足を踏み入れた。' : 'Her grandmother\'s words echoed in her mind, giving her the courage to continue. With a deep breath, Sarah stepped into the <i>abandoned house</i>.'}</p>

<img-novel id="abandonedHouse" />

<h3>${language === 'ja' ? '彼女の持ち物：' : 'Her possessions:'}</h3>
<ul>
  <li>${language === 'ja' ? '懐中電灯' : 'Flashlight'}</li>
  <li>${language === 'ja' ? '地図' : 'Map'}</li>
  <li>${language === 'ja' ? '勇気' : 'Courage'}</li>
</ul>`}
          </code>
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">{currentContent.needMoreHelp.title}</h2>
        <p>{currentContent.needMoreHelp.content}</p>
      </section>
    </div>
  );
};

export default HelpPage;
