   function showToast(message, duration = 3000) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {
          toast.classList.remove("show");
        }, duration);
      }

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
        const mingguStat = {};

        pembeliList.forEach((p, i) => {
          const id = `KC${String(i + 1).padStart(3, "0")}`;
          if (p.cicilan.length > 0) {
            container.innerHTML += `<strong>${id} - ${p.nama}</strong><br/>`;
            p.cicilan.forEach((c, idx) => {
              container.innerHTML += `
          <div class="log-entry">
            Minggu ${idx + 1}: Rp ${c.jumlah.toLocaleString()} (${c.tanggal})
            <button onclick="editCicilan(${i}, ${idx})">Edit</button>
          </div>`;
              mingguStat[idx + 1] = (mingguStat[idx + 1] || 0) + c.jumlah;
            });
            container.innerHTML += "<br/>";
          }
        });


        if (Object.keys(mingguStat).length > 0) {
          container.innerHTML += `<hr><strong>Total Cicilan Tiap Minggu:</strong><br/>`;
          Object.entries(mingguStat).forEach(([minggu, total]) => {
            container.innerHTML += `<div>Minggu ${minggu}: Rp ${total.toLocaleString()}</div>`;
          });
        }
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

          showToast("Berhasil menambahkan data pembeli!");
        });

      function tambahCicilanManual() {
        const index = document.getElementById("pembeliIndex").value;
        const jumlah = parseInt(document.getElementById("jumlahCicilan").value);
        const tanggal = document.getElementById("tanggalCicilan").value;

        if (index === "" || isNaN(jumlah) || !tanggal) {
          showToast("Lengkapi data cicilan!", 4000);
          return;
        }

        const pembeli = pembeliList[index];
        const sisa = pembeli.harga - pembeli.cicilanTotal;

        if (jumlah > sisa) {
          showToast("Jumlah cicilan melebihi sisa yang harus dibayar.", 4000);
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

        showToast("Berhasil menambahkan cicilan!");
      }

      function hapusPembeli(index) {
        if (confirm("Yakin ingin menghapus pembeli ini?")) {
          pembeliList.splice(index, 1);
          simpanData();
          renderTabel();
          showToast("Data pembeli berhasil dihapus.");
        }
      }

      function resetData() {
        if (confirm("Yakin ingin menghapus semua data?")) {
          localStorage.removeItem("pembeliList");
          pembeliList = [];
          renderTabel();
          showToast("Semua data berhasil direset.");
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

          showToast("Data pembeli berhasil diperbarui.");
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

      function editCicilan(indexPembeli, indexCicilan) {
        const cicilan = pembeliList[indexPembeli].cicilan[indexCicilan];

        const nilaiBaru = prompt(
          `Ubah jumlah cicilan minggu ${
            indexCicilan + 1
          } (saat ini Rp ${cicilan.jumlah.toLocaleString()}):`,
          cicilan.jumlah
        );

        const jumlahBaru = parseInt(nilaiBaru);

        if (!isNaN(jumlahBaru) && jumlahBaru >= 0) {
          const pembeli = pembeliList[indexPembeli];
          pembeli.cicilan[indexCicilan].jumlah = jumlahBaru;
          pembeli.cicilanTotal = pembeli.cicilan.reduce(
            (sum, c) => sum + c.jumlah,
            0
          );

          simpanData();
          renderTabel();

          showToast("Jumlah cicilan berhasil diperbarui.");
        } else {
          alert("Nominal tidak valid.");
        }
      }

      function exportToExcel() {
        const headers = [
          "ID",
          "Nama",
          "Kategori",
          "Ukuran",
          "Harga",
          "Cicilan Total",
          "Sisa",
          "Status",
        ];

        let table = `<table><tr>${headers
          .map((h) => `<th>${h}</th>`)
          .join("")}</tr>`;

        pembeliList.forEach((p, i) => {
          const id = `KC${String(i + 1).padStart(3, "0")}`;
          const sisa = p.harga - p.cicilanTotal;
          const status = sisa <= 0 ? "Lunas" : "Belum Lunas";

          table += `<tr>
      <td>${id}</td>
      <td>${p.nama}</td>
      <td>${p.kategori}</td>
      <td>${p.ukuran}</td>
      <td>${p.harga}</td>
      <td>${p.cicilanTotal}</td>
      <td>${sisa}</td>
      <td>${status}</td>
    </tr>`;
        });

        table += `</table>`;

        const blob = new Blob([table], {
          type: "application/vnd.ms-excel",
        });

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "data_pembayaran_kaos.xls";
        a.click();
      }

      window.onload = () => {
        renderTabel();
        document.getElementById("tanggalCicilan").value = new Date()
          .toISOString()
          .split("T")[0];
      };
