class CustomSearchForm extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                }
                .search-form {
                    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
                    border-radius: 20px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                    box-shadow: 0 8px 32px rgba(108, 92, 231, 0.16);
                    padding: 24px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    position: relative;
                }
                .search-form::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 20px;
                    padding: 2px;
                    
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }
                .search-title {
                    margin-bottom: 20px;
                }
                .search-title h2 {
                    margin: 0 0 6px;
                    font-size: 20px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #6C5CE7 0%, #FF6B6B 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    letter-spacing: -0.3px;
                }
                .search-title h2::before {
                    
                    font-size: 22px;
                    -webkit-text-fill-color: initial;
                }
                .search-subtitle {
                    margin: 0;
                    font-size: 13px;
                    color: #6c757d;
                    line-height: 1.5;
                }
                .filters-section {
                    border-top: 1px solid #e9ecef;
                    padding-top: 20px;
                }
                .section-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a1a2e;
                    margin: 0 0 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .section-label::before {
                    content: '';
                    width: 4px;
                    height: 16px;
                    background: linear-gradient(135deg, #6C5CE7, #7c6eea);
                    border-radius: 2px;
                }
                .filters-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .field {
                    display: flex;
                    flex-direction: column;
                }
                label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #1a1a2e;
                    margin-bottom: 6px;
                    display: block;
                }
                input, select {
                    width: 100%;
                    padding: 10px 12px;
                    border-radius: 12px;
                    border: 2px solid #e9ecef;
                    font-size: 13px;
                    transition: all 0.2s ease;
                    background: #ffffff;
                    font-family: inherit;
                }
                input:focus, select:focus {
                    outline: none;
                    border-color: #6C5CE7;
                    box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
                }
                input::placeholder {
                    color: #adb5bd;
                }
                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }
                .btn {
                    border-radius: 12px;
                    border: none;
                    padding: 10px 18px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    letter-spacing: -0.2px;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #6C5CE7 0%, #7c6eea 100%);
                    color: #ffffff;
                    box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4);
                }
                .btn-primary:hover {
                    // transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(108, 92, 231, 0.5);
                }
                .btn-primary:active {
                    // transform: translateY(0);
                }
                .btn-secondary {
                    background: #ffffff;
                    color: #6C5CE7;
                    border: 2px solid #e9ecef;
                    box-shadow: 0 2px 8px rgba(108, 92, 231, 0.08);
                }
                .btn-secondary:hover {
                    border-color: #6C5CE7;
                    background: rgba(108, 92, 231, 0.04);
                    // transform: translateY(-1px);
                }
                @media (max-width: 768px) {
                    .search-form {
                        padding: 20px;
                        border-radius: 16px;
                    }
                    .filters-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .actions {
                        flex-direction: column;
                    }
                    .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
                /* Tooltip styles */
                .title-with-help {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .help-icon {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    background: rgba(108, 92, 231, 0.1);
                    color: #6C5CE7;
                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: help;
                    transition: all 0.2s ease;
                    top: -3px
                }

                .help-icon:hover {
                    background: linear-gradient(135deg, #6C5CE7 0%, #7c6eea 100%);
                    color: white;
                    transform: scale(1.1);
                    box-shadow: 0 2px 8px rgba(108, 92, 231, 0.3);
                }

                /* Tooltip popup */
                .help-tooltip {
                    visibility: hidden;
                    opacity: 0;
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 50%;
                    // transform: translateX(-50%);
                    z-index: 1000;
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 16px 18px;
                    width: 420px;
                    max-width: 90vw;
                    box-shadow: 0 8px 24px rgba(108, 92, 231, 0.2), 0 0 0 1px rgba(108, 92, 231, 0.1);
                    transition: opacity 0.2s ease, visibility 0.2s ease;
                }

                .help-icon:hover .help-tooltip {
                    visibility: visible;
                    opacity: 1;
                }

                /* Arrow tooltip */
                .help-tooltip::after {
                    content: '';
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    // transform: translateX(-50%);
                    border: 6px solid transparent;
                    border-bottom-color: #ffffff;
                }

                .help-tooltip-title {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    font-weight: 600;
                    background: linear-gradient(135deg, #6C5CE7 0%, #FF6B6B 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .help-tooltip ul {
                    margin: 0;
                    padding-left: 18px;
                    list-style: none;
                }

                .help-tooltip li {
                    margin-bottom: 8px;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #6c757d;
                    position: relative;
                    padding-left: 0;
                }

                .help-tooltip li:last-child {
                    margin-bottom: 0;
                }

                .help-tooltip li::before {
                    content: "•";
                    position: absolute;
                    left: -14px;
                    color: #6C5CE7;
                    font-weight: 700;
                }

                .help-tooltip strong {
                    color: #1a1a2e;
                    font-weight: 600;
                }

                .help-tooltip code {
                    background: rgba(108, 92, 231, 0.08);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    color: #6C5CE7;
                    font-weight: 600;
                }

                /* Mobile responsive */
                @media (max-width: 640px) {
                    .help-tooltip {
                        width: 320px;
                        padding: 14px 16px;
                        left: auto;
                        right: 0;
                        transform: none;
                    }
                    
                    .help-tooltip::after {
                        left: auto;
                        right: 20px;
                        transform: none;
                    }
                    
                    .help-tooltip-title {
                        font-size: 13px;
                    }
                    
                    .help-tooltip li {
                        font-size: 11px;
                    }
                }

            </style>
            <div class="search-form">
                <div class="search-title">
                    <div class="title-with-help">
                        <h2>Bộ lọc thông tin</h2>
                        <div class="help-icon">
                            i
                            <div class="help-tooltip">
                                <div class="help-tooltip-title">
                                    💡 Mẹo tìm kiếm
                                </div>
                                <ul>
                                    <li>
                                        <strong>Tìm kiếm cơ bản:</strong> Nhập nhiều từ khóa để tìm KQ có tất cả từ, không phân biệt thứ tự.
                                    </li>
                                    <li>
                                        <strong>Toán tử <code>+</code>:</strong> Đặt dấu + trước từ khóa để hiện kết quả phải chứa từ.
                                    </li>
                                    <li>
                                        <strong>Toán tử <code>-</code>:</strong> Đặt dấu - trước từ khóa để loại bỏ kết quả có chứa từ.
                                    </li>
                                    <li>
                                        <strong>Toán tử <code>OR</code>:</strong> Dùng OR giữa các từ khóa để tìm KQ có chứa ít nhất một trong các từ.
                                    </li>
                                    <li>
                                        <strong>Tìm chính xác:</strong> Dùng dấu ngoặc kép <code>" "</code> để tìm cụm từ chính xác.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="filters-section">
                    <p class="section-label">Ngày phê duyệt</p>
                    <div class="filters-grid">
                        <div class="field">
                            <label for="filter-date-from">Từ ngày</label>
                            <input id="filter-date-from" type="date">
                        </div>
                        <div class="field">
                            <label for="filter-date-to">Đến ngày</label>
                            <input id="filter-date-to" type="date">
                        </div>
                    </div>

                    <p class="section-label">Thông tin thầu</p>
                    <div class="filters-grid">
                        <div class="field">
                            <label for="filter-investor">Chủ đầu tư</label>
                            <input id="filter-investor" type="text" placeholder="Tên cơ sở KCB">
                        </div>
                        <div class="field">
                            <label for="filter-selection-method">Hình thức lựa chọn nhà thầu</label>
                            <select id="filter-selection-method">
                                <option value="">-- Chọn hình thức --</option>
                                <option value="Đấu thầu rộng rãi">Đấu thầu rộng rãi</option>
                                <option value="Đấu thầu hạn chế">Đấu thầu hạn chế</option>
                                <option value="Chỉ định thầu">Chỉ định thầu</option>
                                <option value="Chào hàng cạnh tranh">Chào hàng cạnh tranh</option>
                                <option value="Mua sắm trực tiếp">Mua sắm trực tiếp</option>
                                <option value="Tự thực hiện">Tự thực hiện</option>
                                <option value="Tham gia thực hiện của cộng đồng">Tham gia thực hiện của cộng đồng</option>
                                <option value="Đàm phán giá">Đàm phán giá</option>
                                <option value="Lựa chọn nhà thầu trong trường hợp đặc biệt">Lựa chọn nhà thầu trong trường hợp đặc biệt</option>
                                <option value="Đặt hàng">Đặt hàng</option>
                                <option value="Chào giá trực tuyến">Chào giá trực tuyến</option>
                                <option value="Chào giá trực tuyến theo quy trình rút gọn">Chào giá trực tuyến theo quy trình rút gọn</option>
                                <option value="Mua sắm trực tuyến">Mua sắm trực tuyến</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="filter-approval-decision">Số quyết định phê duyệt</label>
                            <input id="filter-approval-decision" type="text" placeholder="VD: 01/QĐ-TTYT">
                        </div>
                        <div class="field">
                            <label for="filter-place">Tỉnh/Thành phố</label>
                            <select id="filter-place">
                                <option value="">-- Chọn tỉnh/thành phố --</option>

                                <option value="Tỉnh An Giang">An Giang</option>
                                <option value="Tỉnh Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                                <option value="Tỉnh Bắc Giang">Bắc Giang</option>
                                <option value="Tỉnh Bắc Kạn">Bắc Kạn</option>
                                <option value="Tỉnh Bạc Liêu">Bạc Liêu</option>
                                <option value="Tỉnh Bắc Ninh">Bắc Ninh</option>
                                <option value="Tỉnh Bến Tre">Bến Tre</option>
                                <option value="Tỉnh Bình Định">Bình Định</option>
                                <option value="Tỉnh Bình Dương">Bình Dương</option>
                                <option value="Tỉnh Bình Phước">Bình Phước</option>
                                <option value="Tỉnh Bình Thuận">Bình Thuận</option>
                                <option value="Tỉnh Cà Mau">Cà Mau</option>
                                <option value="Thành phố Cần Thơ">Cần Thơ</option>
                                <option value="Tỉnh Cao Bằng">Cao Bằng</option>
                                <option value="Thành phố Đà Nẵng">Đà Nẵng</option>
                                <option value="Tỉnh Đắk Lắk">Đắk Lắk</option>
                                <option value="Tỉnh Đắk Nông">Đắk Nông</option>
                                <option value="Tỉnh Điện Biên">Điện Biên</option>
                                <option value="Tỉnh Đồng Nai">Đồng Nai</option>
                                <option value="Tỉnh Đồng Tháp">Đồng Tháp</option>
                                <option value="Tỉnh Gia Lai">Gia Lai</option>
                                <option value="Tỉnh Hà Giang">Hà Giang</option>
                                <option value="Tỉnh Hà Nam">Hà Nam</option>
                                <option value="Thành phố Hà Nội">Hà Nội</option>
                                <option value="Tỉnh Hà Tĩnh">Hà Tĩnh</option>
                                <option value="Tỉnh Hải Dương">Hải Dương</option>
                                <option value="Thành phố Hải Phòng">Hải Phòng</option>
                                <option value="Tỉnh Hậu Giang">Hậu Giang</option>
                                <option value="Thành phố Hồ Chí Minh">Hồ Chí Minh</option>
                                <option value="Tỉnh Hòa Bình">Hòa Bình</option>
                                <option value="Tỉnh Hưng Yên">Hưng Yên</option>
                                <option value="Tỉnh Khánh Hòa">Khánh Hòa</option>
                                <option value="Tỉnh Kiên Giang">Kiên Giang</option>
                                <option value="Tỉnh Kon Tum">Kon Tum</option>
                                <option value="Tỉnh Lai Châu">Lai Châu</option>
                                <option value="Tỉnh Lâm Đồng">Lâm Đồng</option>
                                <option value="Tỉnh Lạng Sơn">Lạng Sơn</option>
                                <option value="Tỉnh Lào Cai">Lào Cai</option>
                                <option value="Tỉnh Long An">Long An</option>
                                <option value="Tỉnh Nam Định">Nam Định</option>
                                <option value="Tỉnh Nghệ An">Nghệ An</option>
                                <option value="Tỉnh Ninh Bình">Ninh Bình</option>
                                <option value="Tỉnh Ninh Thuận">Ninh Thuận</option>
                                <option value="Tỉnh Phú Thọ">Phú Thọ</option>
                                <option value="Tỉnh Phú Yên">Phú Yên</option>
                                <option value="Tỉnh Quảng Bình">Quảng Bình</option>
                                <option value="Tỉnh Quảng Nam">Quảng Nam</option>
                                <option value="Tỉnh Quảng Ngãi">Quảng Ngãi</option>
                                <option value="Tỉnh Quảng Ninh">Quảng Ninh</option>
                                <option value="Tỉnh Quảng Trị">Quảng Trị</option>
                                <option value="Tỉnh Sóc Trăng">Sóc Trăng</option>
                                <option value="Tỉnh Sơn La">Sơn La</option>
                                <option value="Tỉnh Tây Ninh">Tây Ninh</option>
                                <option value="Tỉnh Thái Bình">Thái Bình</option>
                                <option value="Tỉnh Thái Nguyên">Thái Nguyên</option>
                                <option value="Tỉnh Thanh Hóa">Thanh Hóa</option>
                                <option value="Tỉnh Thừa Thiên Huế">Thừa Thiên Huế</option>
                                <option value="Tỉnh Tiền Giang">Tiền Giang</option>
                                <option value="Tỉnh Trà Vinh">Trà Vinh</option>
                                <option value="Tỉnh Tuyên Quang">Tuyên Quang</option>
                                <option value="Tỉnh Vĩnh Long">Vĩnh Long</option>
                                <option value="Tỉnh Vĩnh Phúc">Vĩnh Phúc</option>
                                <option value="Tỉnh Yên Bái">Yên Bái</option>
                            </select>
                        </div>

                        <div class="field">
                            <label for="filter-validity">Tình trạng hiệu lực</label>
                            <select id="filter-validity">
                                <option value="">-- Còn/hết hiệu lực --</option>
                                <option value="Còn hiệu lực">Còn hiệu lực</option>
                                <option value="Hết hiệu lực">Hết hiệu lực</option>
                            </select>
                        </div>
                    </div>

                    <p class="section-label">Thông tin hàng hóa</p>
                    <div class="filters-grid">
                        <div class="field">
                            <label for="filter-drug-name">Tên thương mại</label>
                            <input id="filter-drug-name" type="text" placeholder="VD: Paracetamol">
                        </div>
                        <div class="field">
                            <label for="filter-active-ingredient">Hoạt chất</label>
                            <input id="filter-active-ingredient" type="text" placeholder="VD: Paracetamol">
                        </div>
                        <div class="field">
                            <label for="filter-concentration">Nồng độ, hàm lượng</label>
                            <input id="filter-concentration" type="text" placeholder="VD: 500mg">
                        </div>
                        <div class="field">
                            <label for="filter-route">Đường dùng</label>
                            <input id="filter-route" type="text" placeholder="VD: Uống">
                        </div>
                        <div class="field">
                            <label for="filter-dosage-form">Dạng bào chế</label>
                            <input id="filter-dosage-form" type="text" placeholder="VD: Viên nén">
                        </div>
                        <div class="field">
                            <label for="filter-specification">Quy cách đóng gói</label>
                            <input id="filter-specification" type="text" placeholder="VD: Hộp 10 vỉ x 10 viên">
                        </div>
                        <div class="field">
                            <label for="filter-drug-group">Nhóm thuốc</label>
                            <input id="filter-drug-group" type="text" placeholder="VD: N1">
                        </div>
                        <div class="field">
                            <label for="filter-reg-no">Số đăng ký</label>
                            <input id="filter-reg-no" type="text" placeholder="VD: VD-12345-18">
                        </div>
                    </div>

                    <p class="section-label">Nhà sản xuất</p>
                    <div class="filters-grid">
                        <div class="field">
                            <label for="filter-manufacturer">Cơ sở sản xuất</label>
                            <input id="filter-manufacturer" type="text" placeholder="Tên nhà máy/công ty">
                        </div>
                        <div class="field">
                            <label for="filter-country">Nước sản xuất</label>
                            <input id="filter-country" type="text" placeholder="VD: Việt Nam, Ấn Độ">
                        </div>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn btn-secondary" id="reset-filters-btn">
                        Đặt lại
                    </button>
                    <button class="btn btn-primary" id="apply-filters-btn">
                        Áp dụng tìm kiếm
                    </button>
                </div>
            </div>
        `;

        const root = this.shadowRoot;

        // Xử lý tooltip render ra ngoài shadow DOM
        const helpIcon = root.querySelector('.help-icon');
        const tooltipContent = root.querySelector('.help-tooltip');

        // Ẩn tooltip trong shadow DOM
        tooltipContent.style.display = 'none';

        // Tạo tooltip element bên ngoài shadow DOM
        let externalTooltip = null;

        helpIcon.addEventListener('mouseenter', () => {
            // Tạo tooltip mới ngoài shadow DOM
            externalTooltip = document.createElement('div');
            externalTooltip.className = 'external-tooltip';
            externalTooltip.innerHTML = tooltipContent.innerHTML;
            
            // Style cho tooltip
            externalTooltip.style.cssText = `
                position: absolute;
                background: #ffffff;
                border-radius: 12px;
                padding: 16px 18px;
                width: 420px;
                max-width: 90vw;
                box-shadow: 0 8px 24px rgba(108, 92, 231, 0.2), 0 0 0 1px rgba(108, 92, 231, 0.1);
                z-index: 999999;
                font-family: 'Inter', sans-serif;
            `;
            
            // Tính toán vị trí
            const rect = helpIcon.getBoundingClientRect();
            externalTooltip.style.top = `${rect.bottom + 8}px`;
            externalTooltip.style.left = `${rect.left + rect.width / 2 - 210}px`; // 210 = 420/2
            
            // Style cho nội dung bên trong
            const style = document.createElement('style');
            style.textContent = `
                .external-tooltip .help-tooltip-title {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    font-weight: 600;
                    background: linear-gradient(135deg, #6C5CE7 0%, #FF6B6B 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .external-tooltip ul {
                    margin: 0;
                    padding-left: 18px;
                    list-style: none;
                }
                .external-tooltip li {
                    margin-bottom: 8px;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #6c757d;
                    position: relative;
                }
                .external-tooltip li::before {
                    content: "•";
                    position: absolute;
                    left: -14px;
                    color: #6C5CE7;
                    font-weight: 700;
                }
                .external-tooltip strong {
                    color: #1a1a2e;
                    font-weight: 600;
                }
                .external-tooltip code {
                    background: rgba(108, 92, 231, 0.08);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    color: #6C5CE7;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(externalTooltip);
        });

        helpIcon.addEventListener('mouseleave', () => {
            if (externalTooltip) {
                externalTooltip.remove();
                externalTooltip = null;
            }
        });

        const inputs = root.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    root.getElementById('apply-filters-btn').click();
                }
            });
        });

        // Apply filters button
        root.getElementById('apply-filters-btn').addEventListener('click', () => {
            const payload = {
                // Thông tin thời gian
                dateFrom: root.getElementById('filter-date-from').value,
                dateTo: root.getElementById('filter-date-to').value,

                // Thông tin thầu
                investor: root.getElementById('filter-investor').value.trim(),
                selectionMethod: root.getElementById('filter-selection-method').value.trim(),
                approvalDecision: root.getElementById('filter-approval-decision').value.trim(),
                place: root.getElementById('filter-place').value.trim(),
                validity: root.getElementById('filter-validity').value.trim(),

                // Thông tin hàng hóa
                drugName: root.getElementById('filter-drug-name').value.trim(),
                activeIngredient: root.getElementById('filter-active-ingredient').value.trim(),
                concentration: root.getElementById('filter-concentration').value.trim(),
                route: root.getElementById('filter-route').value,
                dosageForm: root.getElementById('filter-dosage-form').value,
                specification: root.getElementById('filter-specification').value.trim(),
                drugGroup: root.getElementById('filter-drug-group').value.trim(),
                regNo: root.getElementById('filter-reg-no').value.trim(),

                // Thông tin nhà sản xuất
                manufacturer: root.getElementById('filter-manufacturer').value.trim(),
                country: root.getElementById('filter-country').value.trim()
            };
            this.dispatchEvent(new CustomEvent('apply-filters', {
                detail: payload,
                bubbles: true,
                composed: true
            }));
        });

        // Reset button
        root.getElementById('reset-filters-btn').addEventListener('click', () => {
            // Reset thông tin thời gian
            root.getElementById('filter-date-from').value = '';
            root.getElementById('filter-date-to').value = '';

            // Reset thông tin thầu
            root.getElementById('filter-investor').value = '';
            root.getElementById('filter-selection-method').value = '';
            root.getElementById('filter-approval-decision').value = '';
            root.getElementById('filter-place').value = '';
            root.getElementById('filter-validity').value = '';
    
            // Reset thông tin hàng hóa
            root.getElementById('filter-drug-name').value = '';
            root.getElementById('filter-active-ingredient').value = '';
            root.getElementById('filter-concentration').value = '';
            root.getElementById('filter-route').value = '';
            root.getElementById('filter-dosage-form').value = '';
            root.getElementById('filter-specification').value = '';
            root.getElementById('filter-drug-group').value = '';
            root.getElementById('filter-reg-no').value = '';

            // Reset thông tin nhà sản xuất
            root.getElementById('filter-manufacturer').value = '';
            root.getElementById('filter-country').value = '';

            this.dispatchEvent(new CustomEvent('reset-filters', {
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define('custom-search-form', CustomSearchForm);
