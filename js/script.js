  const hargaKategori = {
        Dewasa: 175000,
        Remaja: 75000,
        Anak: 50000,
      };

      let pembeliList = JSON.parse(localStorage.getItem("pembeliList")) || [];

      function simpanData() {
        localStorage.setItem("pembeliList", JSON.stringify(pembeliList));
      }

      function renderTabel() {
        const tabel = document.getElementById("dataTabel");
        const selectPembeli = document.getElementById("pembeliIndex");
        const filterId = document
          .getElementById("filterId")
          .value.trim()
          .toUpperCase();
        const filterStatus = document.getElementById("filterStatus").value;
        const filterKategori = document.getElementById("filterKategori").value;
        const filterUkuran = document.getElementById("filterUkuran").value;

        tabel.innerHTML = "";
        selectPembeli.innerHTML = `<option value="">Pilih Pembeli</option>`;

        let totalMasuk = 0,
          totalSisa = 0;

        pembeliList.forEach((p, i) => {
          const id = `KC${String(i + 1).padStart(3, "0")}`;
          const sisa = p.harga - p.cicilanTotal;
          const status = sisa <= 0 ? "Lunas" : "Belum Lunas";

          if (filterId && !id.includes(filterId)) return;
          if (filterStatus === "lunas" && sisa > 0) return;
          if (filterStatus === "belum" && sisa <= 0) return;
          if (filterKategori && p.kategori !== filterKategori) return;
          if (filterUkuran && p.ukuran !== filterUkuran) return;

          const row = document.createElement("tr");
          const statusClass = sisa <= 0 ? "status-lunas" : "status-belum";
          row.innerHTML = `
      <td>${id}</td>
      <td>${p.nama}</td>
      <td>${p.kategori}</td>
      <td>${p.ukuran}</td>
      <td>Rp ${p.harga.toLocaleString()}</td>
      <td>Rp ${p.cicilanTotal.toLocaleString()}</td>
      <td class="td-sisa">Rp ${sisa.toLocaleString()}</td>
      <td class="${statusClass}">${status}</td>
      <td>
        <button class="action-btn edit" onclick="editPembeli(${i})">Edit</button>
        <button class="action-btn delete" onclick="hapusPembeli(${i})">Hapus</button>
      </td>
    `;
          tabel.appendChild(row);

          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = `${id} - ${p.nama}`;
          selectPembeli.appendChild(opt);

          totalMasuk += p.cicilanTotal;
          totalSisa += sisa;
        });

        document.getElementById("statistik").innerHTML = `
  <span style="color: black;">Total Peserta: ${pembeliList.length}</span>
  &nbsp;|&nbsp;
  <span style="color:  #0d47a1;">Total Masuk: Rp ${totalMasuk.toLocaleString()}</span>
  &nbsp;|&nbsp;
  <span style="color: red;">Total Sisa: Rp ${totalSisa.toLocaleString()}</span>
`;

        renderCicilanLogGlobal();
      }

      function renderCicilanLogGlobal() {
        const container = document.getElementById("cicilanLogGlobal");
        container.innerHTML = "";
        pembeliList.forEach((p, i) => {
          const id = `KC${String(i + 1).padStart(3, "0")}`;
          if (p.cicilan.length > 0) {
            container.innerHTML += `<strong>${id} - ${p.nama}</strong><br/>`;
            p.cicilan.forEach((c, idx) => {
              container.innerHTML += `<div class="log-entry">Minggu ${
                idx + 1
              }: Rp ${c.jumlah.toLocaleString()} (${c.tanggal})</div>`;
            });
            container.innerHTML += "<br/>";
          }
        });
      }

      function toggleSemuaLog() {
        const log = document.getElementById("cicilanLogGlobal");
        log.style.display = log.style.display === "none" ? "block" : "none";
      }

      document
        .getElementById("formPembeli")
        .addEventListener("submit", function (e) {
          e.preventDefault();
          const nama = document.getElementById("nama").value.trim();
          const kategori = document.getElementById("kategori").value;
          const ukuran = document.getElementById("ukuran").value;
          if (!nama || !kategori || !ukuran) return;

          const harga = hargaKategori[kategori];
          pembeliList.push({
            nama,
            kategori,
            ukuran,
            harga,
            cicilanTotal: 0,
            cicilan: [],
            tanggal: new Date().toLocaleDateString("id-ID"),
          });

          simpanData();
          renderTabel();
          this.reset();
        });

      function tambahCicilanManual() {
        const index = document.getElementById("pembeliIndex").value;
        const jumlah = parseInt(document.getElementById("jumlahCicilan").value);
        const tanggal = document.getElementById("tanggalCicilan").value;

        if (index === "" || isNaN(jumlah) || !tanggal) {
          alert("Lengkapi data cicilan!");
          return;
        }

        const pembeli = pembeliList[index];
        const sisa = pembeli.harga - pembeli.cicilanTotal;

        if (jumlah > sisa) {
          alert("Jumlah cicilan melebihi sisa yang harus dibayar.");
          return;
        }

        pembeli.cicilan.push({ jumlah, tanggal });
        pembeli.cicilanTotal += jumlah;

        simpanData();
        renderTabel();

        document.getElementById("jumlahCicilan").value = "";
        document.getElementById("tanggalCicilan").value = new Date()
          .toISOString()
          .split("T")[0];
      }

      function hapusPembeli(index) {
        if (confirm("Yakin ingin menghapus pembeli ini?")) {
          pembeliList.splice(index, 1);
          simpanData();
          renderTabel();
        }
      }

      function resetData() {
        if (confirm("Yakin ingin menghapus semua data?")) {
          localStorage.removeItem("pembeliList");
          pembeliList = [];
          renderTabel();
        }
      }

      function editPembeli(index) {
        const p = pembeliList[index];
        const newNama = prompt("Edit nama:", p.nama);
        const newKategori = prompt(
          "Edit kategori (Dewasa/Remaja/Anak):",
          p.kategori
        );
        const newUkuran = prompt("Edit ukuran (S/M/L/XL/XXL):", p.ukuran);

        if (
          newNama &&
          hargaKategori[newKategori] &&
          ["S", "M", "L", "XL", "XXL"].includes(newUkuran)
        ) {
          p.nama = newNama;
          p.kategori = newKategori;
          p.ukuran = newUkuran;
          p.harga = hargaKategori[newKategori];
          const totalCicilan = p.cicilan.reduce((sum, c) => sum + c.jumlah, 0);
          p.cicilanTotal = totalCicilan;

          simpanData();
          renderTabel();
        } else {
          alert("Input tidak valid. Edit dibatalkan.");
        }
      }

      document
        .getElementById("filterKategori")
        .addEventListener("change", renderTabel);
      document
        .getElementById("filterUkuran")
        .addEventListener("change", renderTabel);

      function exportToExcel() {
        const headers = [
          "Nama",
          "Kategori",
          "Ukuran",
          "Harga",
          "Cicilan Total",
        ];
        const data = pembeliList.map((p) => [
          p.nama,
          p.kategori,
          p.ukuran,
          p.harga,
          p.cicilanTotal,
          p.tanggal || "-",
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Cicilan");
        XLSX.writeFile(workbook, "Data_Cicilan.xlsx");
      }

      window.onload = () => {
        renderTabel();
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("tanggalCicilan").value = today;
      };
