import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Pricing() {
  const [activeFaq, setActiveFaq] = useState(null)

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const plans = [
    {
      name: '1 Tháng',
      tagline: 'Linh hoạt tối đa',
      price: '199.000đ',
      period: '/tháng',
      saving: null,
      features: ['Học toàn bộ giáo trình', 'Luyện đề HSK'],
      actionText: 'Bắt đầu ngay',
      theme: 'bg-white text-[#161d16] border border-gray-200 hover:shadow-lg',
      btnTheme: 'border border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/5',
      badge: null
    },
    {
      name: '3 Tháng',
      tagline: 'Phổ biến cho người mới',
      price: '499.000đ',
      period: '',
      saving: 'Tiết kiệm ~16%',
      features: ['Học toàn bộ giáo trình', 'Luyện đề HSK', 'Thẻ từ vựng SRS'],
      actionText: 'Bắt đầu ngay',
      theme: 'bg-white text-[#161d16] border border-gray-200 hover:shadow-lg',
      btnTheme: 'border border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/5',
      badge: null
    },
    {
      name: '12 Tháng',
      tagline: 'Cam kết lâu dài',
      price: '1.599.000đ',
      period: '',
      saving: 'Giảm ngay 33%',
      features: ['Toàn bộ tính năng Pro', 'Chế độ Ngoại tuyến', 'Cộng đồng VIP', 'Hỗ trợ 24/7'],
      actionText: 'Bắt đầu ngay',
      theme: 'bg-[#006e2f] text-white border-4 border-[#22c55e]/30 shadow-xl scale-105 relative z-10',
      btnTheme: 'bg-white text-[#006e2f] hover:bg-gray-100 font-bold',
      badge: 'Recommended'
    },
    {
      name: '6 Tháng',
      tagline: 'Giá trị vượt trội',
      price: '899.000đ',
      period: '',
      saving: 'Tiết kiệm ~25%',
      features: ['Học toàn bộ giáo trình', 'Luyện đề HSK', 'Chế độ Ngoại tuyến'],
      actionText: 'Bắt đầu ngay',
      theme: 'bg-white text-[#161d16] border border-gray-200 hover:shadow-lg',
      btnTheme: 'border border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/5',
      badge: null
    },
    {
      name: 'Vĩnh viễn',
      tagline: 'Học trọn đời',
      price: '3.999.000đ',
      period: '',
      saving: 'Thanh toán 1 lần',
      features: ['Mọi cập nhật tương lai', 'Toàn bộ tính năng Pro', 'Chứng chỉ hoàn thành'],
      actionText: 'Bắt đầu ngay',
      theme: 'bg-gradient-to-br from-green-800 to-[#006e2f] text-white border border-[#22c55e]/25 hover:shadow-2xl',
      btnTheme: 'bg-[#22c55e] text-white hover:bg-[#1eb052] font-bold',
      badge: null
    }
  ]

  const highlights = [
    {
      icon: 'menu_book',
      title: 'Giáo trình đầy đủ',
      desc: 'Từ HSK 1 đến HSK 6 với lộ trình bài bản, ví dụ sinh động và phát âm chuẩn bản xứ.',
      bg: 'bg-emerald-100 text-emerald-700'
    },
    {
      icon: 'quiz',
      title: 'Luyện đề HSK',
      desc: 'Kho đề thi phong phú, sát với thực tế, có chấm điểm và giải thích chi tiết ngay lập tức.',
      bg: 'bg-purple-100 text-purple-700'
    },
    {
      icon: 'psychology',
      title: 'Flashcards SRS',
      desc: 'Công nghệ lặp lại ngắt quãng giúp bạn ghi nhớ từ vựng lâu hơn gấp 5 lần so với cách học cũ.',
      bg: 'bg-amber-100 text-amber-700'
    },
    {
      icon: 'cloud_download',
      title: 'Chế độ Ngoại tuyến',
      desc: 'Tải bài học về máy và tiếp tục hành trình học tập ở bất cứ đâu, kể cả khi không có mạng.',
      bg: 'bg-blue-100 text-blue-700'
    },
    {
      icon: 'groups',
      title: 'Cộng đồng học viên',
      desc: 'Trao đổi kinh nghiệm, giải đáp thắc mắc cùng hàng ngàn học viên khác trên toàn thế giới.',
      bg: 'bg-green-100 text-green-700'
    },
    {
      icon: 'verified',
      title: 'Chứng chỉ uy tín',
      desc: 'Nhận chứng chỉ hoàn thành khóa học sau mỗi cấp độ để làm đẹp hồ sơ năng lực của bạn.',
      bg: 'bg-[#d1e7dd] text-[#0f5132]'
    }
  ]

  const faqs = [
    {
      q: 'Tôi có thể thanh toán bằng hình thức nào?',
      a: 'TidaChinese hỗ trợ đa dạng các hình thức thanh toán bao gồm: Chuyển khoản ngân hàng, Ví điện tử (Momo, ZaloPay), Thẻ tín dụng (Visa, Mastercard) và thanh toán trực tiếp qua App Store/Google Play.'
    },
    {
      q: 'Tôi có thể nâng cấp gói học khi đang sử dụng không?',
      a: 'Hoàn toàn được. Bạn có thể nâng cấp lên các gói dài hạn hơn bất cứ lúc nào. Hệ thống sẽ tự động cộng dồn thời gian sử dụng còn lại của bạn vào gói mới một cách công bằng.'
    },
    {
      q: 'Chính sách hoàn tiền của TidaChinese là gì?',
      a: 'Chúng tôi cam kết hoàn tiền 100% trong vòng 7 ngày đầu tiên nếu bạn cảm thấy chương trình không phù hợp với nhu cầu của mình. Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết nhanh nhất.'
    },
    {
      q: 'Tài khoản "Vĩnh viễn" thực sự kéo dài bao lâu?',
      a: 'Gói Vĩnh viễn cho phép bạn truy cập vào toàn bộ nội dung hiện tại và tất cả các cập nhật, bài học mới được bổ sung trong tương lai mà không bao giờ phải đóng thêm bất kỳ khoản phí nào khác.'
    }
  ]

  return (
    <div className="bg-[#f3fcef] text-[#161d16] font-body-md min-h-screen">
      {/* TopNavBar */}
      <header className="w-full top-0 sticky bg-white border-b border-gray-100 z-50">
        <nav className="flex justify-between items-center px-8 md:px-12 h-20 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-headline-md text-2xl font-black text-[#006e2f]">TidaChinese</Link>
            <div className="hidden md:flex gap-6">
              <Link to="/courses" className="text-gray-500 hover:text-[#006e2f] font-semibold transition-colors">Khóa học</Link>
              <Link to="/tutors" className="text-gray-500 hover:text-[#006e2f] font-semibold transition-colors">Giáo viên</Link>
              <Link to="/pricing" className="text-[#006e2f] font-bold border-b-2 border-[#006e2f] pb-1">Bảng giá</Link>
              <Link to="/community" className="text-gray-500 hover:text-[#006e2f] font-semibold transition-colors">Cộng đồng</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth/login" className="hidden md:block font-semibold text-gray-500 hover:text-[#006e2f] transition-all">Đăng nhập</Link>
            <Link to="/auth/register" className="bg-[#006e2f] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#005321] transition-all shadow-sm">Bắt đầu ngay</Link>
          </div>
        </nav>
      </header>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 px-6 md:px-12 overflow-hidden">
          <div className="max-w-[1280px] mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-[#161d16] mb-6 leading-tight">
              Chọn lộ trình chinh phục<br/>
              <span className="text-[#006e2f]">tiếng Trung của bạn</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              Đầu tư cho kiến thức là khoản đầu tư sinh lời nhất. Mở khóa toàn bộ tính năng cao cấp để đẩy nhanh quá trình làm chủ ngôn ngữ từ hôm nay.
            </p>
          </div>
        </section>

        {/* Pricing Grid */}
        <section className="pb-24 px-6 md:px-12">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
              {plans.map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`p-8 rounded-2xl flex flex-col transition-all duration-300 ${plan.theme}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className={`text-xs ${plan.badge ? 'text-white/80' : 'text-gray-500'}`}>{plan.tagline}</p>
                  </div>
                  <div className="mb-8">
                    <span className="text-2xl md:text-3xl font-black">{plan.price}</span>
                    <span className={`text-sm ${plan.badge ? 'text-white/80' : 'text-gray-500'}`}>{plan.period}</span>
                    {plan.saving && (
                      <span className={`block text-xs font-bold mt-1 ${plan.badge ? 'text-white' : 'text-[#006e2f]'}`}>{plan.saving}</span>
                    )}
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {plan.badge ? 'stars' : 'check_circle'}
                        </span>
                        <span className="text-sm font-semibold">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3.5 px-4 rounded-lg text-sm font-bold transition-all ${plan.btnTheme}`}>
                    {plan.actionText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlight Section */}
        <section className="py-24 bg-white/40 border-y border-gray-100">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12">
            <h2 className="text-3xl font-black text-center text-[#161d16] mb-16">Mọi gói cao cấp đều bao gồm</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className={`p-3 rounded-xl h-fit ${item.bg}`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#161d16] mb-2">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 md:px-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-center text-[#161d16] mb-12">Câu hỏi thường gặp</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx
                return (
                  <div key={idx} className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
                    <button 
                      className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors" 
                      onClick={() => toggleFaq(idx)}
                    >
                      <span className="text-base font-bold text-[#161d16]">{faq.q}</span>
                      <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    <div className={`transition-all duration-300 ease-out overflow-hidden ${isOpen ? 'max-h-40' : 'max-h-0'}`}>
                      <div className="p-6 pt-0 text-gray-500 text-sm leading-relaxed border-t border-gray-50">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-white border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 md:px-12 max-w-[1440px] mx-auto gap-6">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <span className="font-headline-md text-2xl font-black text-[#006e2f]">TidaChinese</span>
            <p className="text-gray-500 text-sm">© 2024 TidaChinese. Master Chinese with confidence.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-sm text-gray-500 hover:underline hover:text-[#006e2f]" href="#">Privacy Policy</a>
            <a className="text-sm text-gray-500 hover:underline hover:text-[#006e2f]" href="#">Terms of Service</a>
            <a className="text-sm text-gray-500 hover:underline hover:text-[#006e2f]" href="#">Help Center</a>
            <a className="text-sm text-gray-500 hover:underline hover:text-[#006e2f]" href="#">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
