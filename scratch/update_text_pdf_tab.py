path = 'src/components/admin/TextPdfTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """        return {
          question_number: q.question_number || idx + 1,
          question_text: q.question_text,
          option_a: q.options?.A || q.option_a || '',
          option_b: q.options?.B || q.option_b || '',
          option_c: q.options?.C || q.option_c || '',
          option_d: q.options?.D || q.option_d || '',
          correct_option: q.correct_answer || q.correct_option || null,
          unit_name: uName,
          macro_topic_name: mName,
          micro_topic_name: miName,
          explanation: expl || null,
          source_pdf: file?.name || paperTitle || null,
          page_number: q.page_number || 1,
        }"""

replacement = """        return {
          question_number: q.question_number || idx + 1,
          question_text: q.question_text,
          question_text_tamil: q.question_text_tamil || q.ta_question_text || q.tamil_question || null,
          option_a: q.options?.A || q.option_a || '',
          option_b: q.options?.B || q.option_b || '',
          option_c: q.options?.C || q.option_c || '',
          option_d: q.options?.D || q.option_d || '',
          option_a_tamil: q.option_a_tamil || q.ta_option_a || null,
          option_b_tamil: q.option_b_tamil || q.ta_option_b || null,
          option_c_tamil: q.option_c_tamil || q.ta_option_c || null,
          option_d_tamil: q.option_d_tamil || q.ta_option_d || null,
          correct_option: q.correct_answer || q.correct_option || null,
          unit_name: uName,
          macro_topic_name: mName,
          micro_topic_name: miName,
          explanation: expl || null,
          explanation_tamil: q.explanation_tamil || q.ta_explanation || null,
          source_pdf: file?.name || paperTitle || null,
          page_number: q.page_number || 1,
        }"""

code_lf = code.replace('\r\n', '\n')
if target in code_lf:
    code_lf = code_lf.replace(target, replacement, 1)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(code_lf)
    print("Updated TextPdfTab.jsx successfully!")
else:
    print("Could not match target in TextPdfTab.jsx")
