export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[#FBF8F2] flex items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3E2F1C]">
            مناجل
          </h1>
        </div>

        <div className="mx-auto mb-6 h-px w-20 bg-[#C9A66B]" />

        <h2 className="text-2xl md:text-3xl font-bold text-[#3E2F1C]">
          المتجر تحت الصيانة
          Store Under Maintenance
        </h2>

        <p className="mt-5 text-base md:text-lg leading-8 text-[#3E2F1C]/70">
          نعمل حاليًا على تطوير المتجر لتحسين تجربتكم.
          We are currently working on developing the store to improve your experience.
          <br />
          سنعود إليكم قريبًا.
          We will be back soon.
        </p>

        <div className="mt-8 inline-flex rounded-full border border-[#C9A66B]/50 bg-[#C9A66B]/10 px-5 py-2.5 text-sm font-semibold text-[#3E2F1C]">
          نعود قريبًا
          Back Soon
        </div>

      </div>
    </main>
  );
}