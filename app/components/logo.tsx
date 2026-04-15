import Image from 'next/image';

export default function Logo() {
  return (
    <div className="w-10 h-10 relative">
      <Image
        src="/logos/logotest.png"
        alt="Flooring Solulu Logo"
        width={40}
        height={40}
        priority
        className="w-full h-full object-contain"
      />
    </div>
  );
}
