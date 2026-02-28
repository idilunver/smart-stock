import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Info, ArrowLeft, Clock, User, Award, Globe, Flame } from 'lucide-react';

interface BlogPost {
    id: number;
    title: string;
    category: string;
    image: string;
    excerpt: string;
    content: string;
    author: string;
    date: string;
    readTime: string;
    icon: React.ReactNode;
}

const blogPosts: BlogPost[] = [
    {
        id: 1,
        title: "Kusursuz V60 Demleme Rehberi: Bilim ve Sanat",
        category: "Demleme Yöntemleri",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
        excerpt: "Hario V60 ile berrak, asidik ve aromatik bir kupa elde etmenin tüm detayları. Döküş tekniklerinden su kimyasına yolculuk.",
        content: `
            Hario V60, dünya çapında en popüler manuel demleme yöntemlerinden biridir. İsmini gövdesinin 60 derecelik açısından alan bu yöntem, doğru uygulandığında kahvenin en ince aromalarını ortaya çıkarır.

            **1. Hazırlık ve Malzemeler**
            İyi bir demleme için sadece kahve ve su yetmez. Bir tartı (hassas terazi), zamanlayıcı ve ince uçlu bir döküş kettle'ı (gooseneck) hayati önem taşır. Kahveniz "orta-ince" öğütülmüş olmalıdır (deniz tuzu kıvamından biraz daha ince).

            **2. Su ve Sıcaklık Dengesi**
            Kullandığınız suyun kalitesi, kupanızın %98'ini oluşturur. Musluk suyu yerine yumuşak içimli bir kaynak suyu tavsiye edilir. İdeal sıcaklık 92°C - 94°C arasıdır. Çok sıcak su acılığa (over-extraction), çok soğuk su ise ekşiliğe (under-extraction) neden olur.

            **3. Demleme Rutini (15g Kahve / 250ml Su)**
            *   **Ön Islatma (Blooming):** 30-45 gram su dökerek kahvenin içindeki CO2 gazının çıkmasını bekleyin. 30 saniye boyunca kahvenin "köpürmesini" izlemek, asıl demlenme için yolu açar.
            *   **Dairesek Döküş:** Dıştan içe değil, merkezden dışa doğru yavaş ve dairesel hareketlerle suyu ekleyin. Kağıt filtreye asla doğrudan su dökmeyin, bu suyun kahveye temas etmeden aşağı geçmesine neden olur.
            *   **Bitiş:** Toplam demleme süreniz 2:30 ile 3:00 dakika arasında bitmelidir. Eğer daha uzun sürüyorsa kahveyi biraz daha kalın öğütmeyi deneyin.

            Hario V60, sabır ve pratik gerektiren bir disiplindir. Her denemede asidite ve gövde dengesini biraz daha iyi anlayacaksınız.
        `,
        author: "Barista Emre",
        date: "12 Mart 2024",
        readTime: "8 dk",
        icon: <Coffee className="text-caramel" size={24} />
    },
    {
        id: 2,
        title: "Kahve Çekirdeklerinin DNA'sı: Arabica vs Robusta",
        category: "Kahve Bilimi",
        image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800",
        excerpt: "İçtiğiniz kahvenin karakterini belirleyen genetik miras. Yükseklik, iklim ve işlem yöntemlerinin lezzet üzerindeki etkisi.",
        content: `
            Kahve dünyasında binlerce tür olsa da ticari olarak iki ana tür baskındır. Ancak bir gurme için bu iki tür arasındaki fark gece ve gündüz gibidir.

            **Arabica (Coffea Arabica): Sofistike ve Hassas**
            Dünya üretiminin %60-70'ini oluşturur. Arabica bitkileri genellikle deniz seviyesinden 800 - 2200 metre yükseklikte yetişir. Yükseklik arttıkça oksijen azalır, meyve daha yavaş olgunlaşır ve bu da çekirdeğin içine daha kompleks asitler, şekerler ve aromatik yağlar dolmasını sağlar. Arabica, 44 kromozomlu yapısıyla genetik olarak çok daha "lezzet odaklıdır".

            **Robusta (Coffea Canephora): Güçlü ve Dirençli**
            Daha düşük rakımlarda yetişebilir ve hastalıklara karşı çok dirençlidir. 22 kromozomludur. Robusta'nın en belirgin farkı kafein oranıdır. Arabica'nın yaklaşık iki katı kafein içerir. Bu yüksek kafein aslında bitkinin kendisini böceklerden korumak için kullandığı bir zehirdir. Lezzet olarak daha topraksı, odunsu ve bazen lastiği andıran notalara sahiptir. Genellikle kaliteli krema verdiği için espresso karışımlarında (blend) gövde artırıcı olarak kullanılır.

            **Yetişme Bölgesinin Önemi**
            *   **Afrika (Etiyopya, Kenya):** Floral, meyvemsi ve yüksek asidite.
            *   **Güney Amerika (Brezilya, Kolombiya):** Çikolatalı, fındıksı ve dengeli.
            *   **Asya (Endonezya, Vietnam):** Baharatlı, ağır gövdeli ve isli notalar.

            Bir sonraki fincanınızda paketin üzerindeki rakımı kontrol edin; 1500 metrenin üzerindeki çekirdekler sizi şaşırtacak aromalar saklıyor olabilir.
        `,
        author: "Zeynep Aras",
        date: "14 Mart 2024",
        readTime: "10 dk",
        icon: <Globe className="text-espresso-400" size={24} />
    },
    {
        id: 3,
        title: "Kavurma Dereceleri ve Tat Profilleri",
        category: "Üretim",
        image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&q=80&w=800",
        excerpt: "Çiğ yeşil çekirdekten aromatik kahveye dönüşüm. Light, Medium ve Dark roast arasındaki kimyasal farklar.",
        content: `
            Kahve kavurma, bir kimya deneyidir. Yeşil çekirdeklerin içindeki hücre yapısı ısıtıldığında milyarlarca aromatik bileşik serbest kalır.

            **Light Roast (Hafif Kavrum)**
            Bu kavrum türünde çekirdeğin orijinal karakteri korunur. "First crack" (ilk çıtlama) sonrası hemen sonlandırılır. Asidite çok yüksektir, meyve ve çiçek notaları baskındır. Eğer kaliteli bir tek kökenli (single origin) kahve içiyorsanız, asıl lezzeti buradan alırsınız.

            **Medium Roast (Orta Kavrum)**
            Şekerlerin karamelize olmaya başladığı aşamadır. Asidite biraz azalırken gövde artar. Çikolata ve tatlı notalar daha belirgindir. "Her damak tadına uygun" denilen profil genellikle budur.

            **Dark Roast (Koyu Kavrum)**
            "Second crack" aşamasına kadar devam edilir. Çekirdeklerin dış yüzeyinde yağlar belirir. Artık çekirdeğin özgün lezzeti değil, kavurma makinesinin (is, kül, bitter) lezzeti hissedilir. Geleneksel İtalyan espressoları ve sütlü içecekler için idealdir çünkü sütle karıştığında kahve tadı kaybolmaz.

            Kavurma süreci kahvenin gövdesini ve dokusunu belirleyen en kritik adımdır.
        `,
        author: "Mert Kavruk",
        date: "15 Mart 2024",
        readTime: "9 dk",
        icon: <Flame className="text-caramel" size={24} />
    }
];

export const BlogPage: React.FC = () => {
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* Header section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[3rem] bg-espresso-900 p-10 lg:p-16 border border-espresso-800 shadow-xl"
            >
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-caramel/10 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                    <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center space-x-2 bg-caramel/20 text-caramel px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-4 border border-caramel/20"
                    >
                        <Award size={14} />
                        <span>Barista Rehberi</span>
                    </motion.span>
                    <h1 className="text-4xl lg:text-6xl font-black text-crema tracking-tighter leading-none mb-6 italic">
                        Kahve <span className="text-caramel">Notları</span>
                    </h1>
                    <p className="text-espresso-300 text-lg leading-relaxed font-medium max-w-2xl">
                        Çekirdeklerin DNA'sından kusursuz bir demlemenin matematiğine kadar; kahve aşkına dair her şey.
                    </p>
                </div>
            </motion.div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedPost(post)}
                        className="group bg-white rounded-[2.5rem] border border-espresso-100 p-6 hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden relative"
                    >
                        <div className="relative h-60 overflow-hidden rounded-[2rem] mb-8">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-[2000ms] ease-out"
                            />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg">
                                <span className="text-[9px] font-black text-espresso-900 uppercase tracking-widest">{post.category}</span>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4 mb-6">
                            <div className="p-3 bg-espresso-50 rounded-[1.2rem]">
                                {post.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-espresso-900 tracking-tight leading-snug group-hover:text-caramel transition-colors duration-500">
                                    {post.title}
                                </h3>
                                <div className="flex items-center space-x-2 mt-2 text-espresso-400 text-[9px] font-black uppercase tracking-widest">
                                    <Clock size={10} />
                                    <span>{post.readTime} OKUMA SÜRESİ</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-espresso-500/80 font-medium leading-relaxed mb-6 line-clamp-2 text-sm italic">
                            {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between border-t border-espresso-50 pt-6">
                            <div className="flex items-center space-x-2 text-espresso-800">
                                <span className="text-[10px] font-black uppercase tracking-widest">{post.author}</span>
                            </div>
                            <div className="flex items-center text-caramel font-black text-[10px] uppercase tracking-widest space-x-1 group-hover:translate-x-2 transition-transform duration-500">
                                <span>REHBERİ İNCELE</span>
                                <Info size={14} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bottom Quote section */}
            <motion.div
                whileInView={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.95 }}
                className="bg-espresso-900 rounded-[3rem] p-12 text-center text-crema relative overflow-hidden shadow-2xl"
            >
                <div className="relative z-10 w-full max-w-2xl mx-auto">
                    <Coffee size={36} className="text-caramel mx-auto mb-6" />
                    <h2 className="text-3xl font-black italic tracking-tighter mb-4">
                        "Fincanındaki her yudum bir hikayedir."
                    </h2>
                    <p className="text-espresso-300 text-sm font-medium tracking-wide">
                        Kendi demlenme yolculuğuna başla. Bilgiyle tazelen.
                    </p>
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {selectedPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    >
                        <div className="absolute inset-0 bg-espresso-950/95 backdrop-blur-2xl" onClick={() => setSelectedPost(null)} />

                        <motion.div
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            className="bg-crema w-full max-w-5xl max-h-[90vh] rounded-[4rem] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row border border-white/20"
                        >
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="absolute top-8 right-8 z-20 bg-espresso-900 text-crema p-4 rounded-full hover:bg-caramel transition-all duration-300 shadow-xl"
                            >
                                <ArrowLeft size={24} />
                            </button>

                            <div className="w-full md:w-[40%] h-64 md:h-auto overflow-hidden">
                                <img src={selectedPost.image} className="w-full h-full object-cover" alt="" />
                            </div>

                            <div className="flex-1 p-10 md:p-16 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center space-x-3 mb-6">
                                    <span className="bg-caramel text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-caramel/20">
                                        {selectedPost.category}
                                    </span>
                                    <span className="text-espresso-300 text-[9px] font-black uppercase tracking-widest">{selectedPost.date}</span>
                                </div>

                                <h2 className="text-4xl md:text-6xl font-black text-espresso-900 tracking-tighter leading-none mb-10">
                                    {selectedPost.title}
                                </h2>

                                <div className="flex items-center space-x-10 mb-12 py-6 border-y border-espresso-100/50">
                                    <div className="flex items-center space-x-3 text-espresso-600">
                                        <div className="w-10 h-10 bg-latte rounded-2xl flex items-center justify-center text-caramel">
                                            <User size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-espresso-300 uppercase tracking-widest leading-none mb-1">Yazarı</span>
                                            <span className="text-sm font-bold">{selectedPost.author}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-espresso-600">
                                        <div className="w-10 h-10 bg-latte rounded-2xl flex items-center justify-center text-caramel">
                                            <Clock size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-espresso-300 uppercase tracking-widest leading-none mb-1">Süre</span>
                                            <span className="text-sm font-bold">{selectedPost.readTime}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {selectedPost.content.split('\n').map((paragraph, i) => {
                                        const trimmed = paragraph.trim();
                                        if (!trimmed) return null;

                                        // Handle bold headers inside content
                                        if (trimmed.startsWith('**')) {
                                            return (
                                                <h4 key={i} className="text-2xl font-black text-espresso-900 tracking-tight mt-10 mb-4 italic">
                                                    {trimmed.replace(/\*\*/g, '')}
                                                </h4>
                                            );
                                        }

                                        // Handle bullet points
                                        if (trimmed.startsWith('*')) {
                                            return (
                                                <div key={i} className="flex items-start space-x-4 ml-4 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-caramel mt-2.5 flex-shrink-0" />
                                                    <p className="text-espresso-700 text-lg font-medium leading-relaxed">
                                                        {trimmed.replace(/^\*\s+/, '')}
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <p key={i} className="text-espresso-700 text-lg leading-relaxed font-medium mb-4">
                                                {trimmed}
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
