import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Všeobecné obchodní podmínky | [Název projektu / firmy]',
  description: 'Všeobecné obchodní podmínky upravující smluvní vztahy a užívání služeb.',
};

export default function ObchodniPodminkyPage() {
  const lastUpdated = '14. září 2026';

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigace zpět */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Zpět na hlavní stránku
          </Link>
        </div>

        {/* Hlavní karta dokumentu */}
        <article className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200/80 space-y-8">
          {/* Hlavička */}
          <header className="border-b border-slate-200 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Všeobecné obchodní podmínky
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Poslední aktualizace: {lastUpdated}
            </p>
          </header>

          {/* Obsah podmínek */}
          <div className="space-y-8 text-slate-600 leading-relaxed text-sm sm:text-base">
            {/* Sekce 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                1. Úvodní ustanovení a provozovatel
              </h2>
              <p>
                1.1. Tyto všeobecné obchodní podmínky (dále jen „VOP“) upravují vzájemná práva a povinnosti vznikající v souvislosti nebo na základě smlouvy o poskytování služeb či prodeji zboží uzavřené mezi provozovatelem a uživatelem (dále jen „Zákazník“).
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-sm space-y-1">
                <p className="font-semibold text-slate-900">Identifikační údaje provozovatele:</p>
                <p><strong>Název / Jméno:</strong> Plavekcý klub Znojmo z.s.</p>
                <p><strong>Sídlo / Adresa:</strong> Marušky Kudeříkové 622/8, Znojmo 66902, Česká republika</p>
                <p><strong>IČO:</strong> 06441254</p>
                <p><strong>E-mail:</strong> info@pkznojmo.cz</p>
                <p><strong>Telefon:</strong> +420777535302</p>
              </div>
              <p>
                1.2. Veškeré smluvní vztahy se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů, a zákonem č. 634/1992 Sb., o ochraně spotřebitele.
              </p>
            </section>

            {/* Sekce 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                2. Vznik smluvního vztahu
              </h2>
              <p>
                2.1. Nabídka služeb či zboží prezentovaná na webovém rozhraní je informativního charakteru a provozovatel není povinen uzavřít smluvní vztah ohledně tohoto zboží či služeb.
              </p>
              <p>
                2.2. Objednávka vytvořená Zákazníkem prostřednictvím webového rozhraní je závazným návrhem na uzavření smlouvy. Přijetí objednávky je Zákazníkovi potvrdeno elektronickou poštou na zadaný e-mail.
              </p>
            </section>

            {/* Sekce 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                3. Ceny a platební podmínky
              </h2>
              <p>
                3.1. Všechny ceny uvedené na rozhraní jsou konečné (včetně všech případných daní a poplatků).
              </p>
              <p>
                3.2. Zákazník může úhradu provést následujícími způsoby:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bezhotovostně platební kartou online přes platební bránu.</li>
              </ul>
            </section>

            {/* Sekce 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                4. Odstoupení od smlouvy spotřebitelem
              </h2>
              <p>
                4.1. Spotřebitel má právo odstoupit od smlouvy bez udání důvodu ve lhůtě 14 dnů od převzetí zboží či uzavření smlouvy o poskytování služeb, není-li dále uvedeno jinak.
              </p>
              <p>
                4.2. Pro odstoupení od smlouvy může spotřebitel využít kontaktní e-mail provozovatele. Peněžní prostředky budou vráceny nejpozději do 14 dnů od doručení odstoupení stejným způsobem, jakým byly přijaty.
              </p>
              <p>
                4.3. Spotřebitel nemůže odstoupit od smlouvy o poskytování služeb, pokud byly splněny s jeho předchozím výslovným souhlasem před uplynutím lhůty pro odstoupení od smlouvy (např. digitální obsah, vstupenky s konkrétním datem plnění).
              </p>
            </section>

            {/* Sekce 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                5. Práva z vadného plnění a reklamace
              </h2>
              <p>
                5.1. Práva a povinnosti smluvních stran ohledně práv z vadného plnění se řídí příslušnými obecně závaznými právními předpisy.
              </p>
              <p>
                5.2. Zákazník je povinen uplatnit reklamaci bez zbytečného odkladu po zjištění vady, a to zasláním e-mailu na adresu provozovatele. Reklamace bude vyřízena nejpozději do 30 dnů od jejího uplatnění.
              </p>
            </section>

            {/* Sekce 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                6. Ochrana osobních údajů
              </h2>
              <p>
                6.1. Ochrana osobních údajů Zákazníka je poskytována v souladu s Nařízením Evropského parlamentu a Rady (EU) 2016/679 (GDPR). Detailní informace o zpracování osobních údajů jsou uvedeny v samostatném dokumentu <Link href="/ochrana-osobnich-udaju" className="text-blue-600 underline hover:text-blue-800">Zásady ochrany osobních údajů</Link>.
              </p>
            </section>

            {/* Sekce 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                7. Mimosoudní řešení spotřebitelských sporů
              </h2>
              <p>
                7.1. K mimosoudnímu řešení spotřebitelských sporů ze smlouvy je příslušná Česká obchodní inspekce, se sídlem Štěpánská 567/15, 120 00 Praha 2, IČ: 000 20 869, internetová adresa: <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://www.coi.cz</a>.
              </p>
            </section>

            {/* Sekce 8 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                8. Závěrečná ustanovení
              </h2>
              <p>
                8.1. Provozovatel je oprávněn znění VOP měnit či doplňovat. Změnou VOP nejsou dotčena práva a povinnosti vzniklá po dobu účinnosti předchozího znění VOP.
              </p>
              <p>
                8.2. Tyto VOP nabývají účinnosti dnem {lastUpdated}.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}