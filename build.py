import os
import re

def build():
    # Definisci i percorsi
    base_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(base_dir, 'src')
    output_file = os.path.join(base_dir, 'index.html')

    print(f"Inizio build di {output_file}...")

    # 1. Carica i componenti HTML
    head_content = open(os.path.join(src_dir, 'components', 'head.html'), 'r', encoding='utf-8').read()
    header_content = open(os.path.join(src_dir, 'components', 'header.html'), 'r', encoding='utf-8').read()
    inputs_content = open(os.path.join(src_dir, 'components', 'inputs.html'), 'r', encoding='utf-8').read()
    results_content = open(os.path.join(src_dir, 'components', 'results.html'), 'r', encoding='utf-8').read()

    # 2. Carica e pulisci i file JS (rimuovi eventuali commenti jsdoc pesanti se vuoi, ma li teniamo per pulizia)
    microzone_js = open(os.path.join(src_dir, 'data', 'microzone.js'), 'r', encoding='utf-8').read()
    calculator_js = open(os.path.join(src_dir, 'js', 'calculator.js'), 'r', encoding='utf-8').read()

    # 3. Assembla il file finale
    full_html = f"""<!DOCTYPE html>
<html lang="it">
{head_content}
<body class="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">

    {header_content}

    <main class="max-w-6xl mx-auto mt-8 p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {inputs_content}
        {results_content}
    </main>

    <script>
{microzone_js}

{calculator_js}
    </script>
</body>
</html>
"""

    # 4. Salva il risultato
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_html)

    print("Build completata con successo! Apri index.html per testare.")

if __name__ == "__main__":
    build()
